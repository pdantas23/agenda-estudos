-- Agenda de Estudos — schema inicial
-- Autenticação própria (nome + senha) com isolamento por token de sessão.
-- As tabelas têm RLS habilitado SEM policies, então a anon key não consegue
-- acessá-las diretamente. Todo acesso passa pelas funções RPC SECURITY DEFINER
-- abaixo, que validam o token e resolvem o usuário dono dos dados.

create extension if not exists pgcrypto;

-- ── Tabelas ────────────────────────────────────────────────────────────────

create table if not exists public.users_agenda (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  senha_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions_agenda (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users_agenda(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.cards_agenda (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users_agenda(id) on delete cascade,
  week_start date not null,                 -- segunda-feira da semana
  dia        text not null,                 -- 'backlog' | 'seg'..'dom'
  posicao    int  not null default 0,       -- ordem dentro da coluna
  materia    text not null,
  conteudo   text not null,
  tipo       text not null check (tipo in ('assunto', 'questoes')),
  cor        text not null,
  concluido  boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cards_agenda_user_week_idx
  on public.cards_agenda (user_id, week_start);

-- ── RLS (nega acesso direto via anon; acesso só pelas RPCs) ──────────────────

alter table public.users_agenda    enable row level security;
alter table public.sessions_agenda enable row level security;
alter table public.cards_agenda    enable row level security;

-- ── Funções ─────────────────────────────────────────────────────────────────

-- Resolve o usuário dono de um token de sessão (uso interno).
create or replace function public.user_from_token(p_token uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select user_id from public.sessions_agenda where token = p_token;
$$;

-- Obs.: contas são criadas direto no banco (não há cadastro pela aplicação).
-- Para criar um usuário, insira na tabela gerando o hash com pgcrypto:
--   insert into public.users_agenda (nome, senha_hash)
--   values ('joao', extensions.crypt('joao123', extensions.gen_salt('bf')));

-- Login: valida nome + senha e abre uma sessão.
create or replace function public.login_agenda(p_nome text, p_senha text)
returns table (user_id uuid, nome text, token uuid)
language plpgsql
security definer
-- inclui o schema `extensions` (onde o Supabase instala o pgcrypto)
set search_path = public, extensions
as $$
declare
  v_user  public.users_agenda;
  v_token uuid;
begin
  select * into v_user
  from public.users_agenda
  where users_agenda.nome = trim(p_nome);

  if v_user.id is null or v_user.senha_hash <> crypt(p_senha, v_user.senha_hash) then
    raise exception 'Nome ou senha inválidos';
  end if;

  insert into public.sessions_agenda (user_id)
  values (v_user.id)
  returning sessions_agenda.token into v_token;

  return query select v_user.id, v_user.nome, v_token;
end;
$$;

-- Logout: descarta a sessão.
create or replace function public.logout_agenda(p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sessions_agenda where token = p_token;
$$;

-- Lê os cards de uma semana do usuário dono do token.
create or replace function public.get_week_cards(p_token uuid, p_week_start date)
returns setof public.cards_agenda
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public.user_from_token(p_token);
begin
  if v_user is null then
    raise exception 'Sessão inválida';
  end if;

  return query
    select * from public.cards_agenda
    where user_id = v_user and week_start = p_week_start
    order by posicao asc, created_at asc;
end;
$$;

-- Substitui todos os cards de uma semana pelo snapshot enviado.
create or replace function public.save_week_cards(
  p_token uuid, p_week_start date, p_cards jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public.user_from_token(p_token);
begin
  if v_user is null then
    raise exception 'Sessão inválida';
  end if;

  delete from public.cards_agenda
  where user_id = v_user and week_start = p_week_start;

  insert into public.cards_agenda
    (id, user_id, week_start, dia, posicao, materia, conteudo, tipo, cor, concluido)
  select
    coalesce((c->>'id')::uuid, gen_random_uuid()),
    v_user,
    p_week_start,
    c->>'dia',
    coalesce((c->>'posicao')::int, 0),
    c->>'materia',
    c->>'conteudo',
    c->>'tipo',
    c->>'cor',
    coalesce((c->>'concluido')::boolean, false)
  from jsonb_array_elements(p_cards) as c;
end;
$$;

-- ── Permissões de execução para a anon key ──────────────────────────────────

grant execute on function public.login_agenda(text, text)       to anon, authenticated;
grant execute on function public.logout_agenda(uuid)            to anon, authenticated;
grant execute on function public.get_week_cards(uuid, date)     to anon, authenticated;
grant execute on function public.save_week_cards(uuid, date, jsonb) to anon, authenticated;
-- user_from_token é interno (chamado pelas RPCs); não recebe grant para anon.
