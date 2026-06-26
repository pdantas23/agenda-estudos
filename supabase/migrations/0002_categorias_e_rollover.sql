-- Agenda de Estudos — categorias novas + rollover semanal
--
-- 1. Adiciona as categorias 'revisao' e 'mapeamento' ao tipo do card.
-- 2. Na virada da semana, os cards não são mais apagados: ao abrir o app já
--    na nova semana, todos os cards da semana anterior voltam para a lista
--    (coluna 'backlog'), com "concluído" desmarcado. O histórico das semanas
--    passadas é preservado (cada semana mantém suas próprias linhas).

-- ── 1. Novas categorias ──────────────────────────────────────────────────────

alter table public.cards_agenda
  drop constraint if exists cards_agenda_tipo_check;

alter table public.cards_agenda
  add constraint cards_agenda_tipo_check
  check (tipo in ('assunto', 'questoes', 'revisao', 'mapeamento'));

-- ── 2. Controle de inicialização da semana (torna o rollover idempotente) ─────

create table if not exists public.week_init_agenda (
  user_id    uuid not null references public.users_agenda(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.week_init_agenda enable row level security;

-- Lê os cards da semana, fazendo o rollover da semana anterior na primeira
-- abertura. Deve ser chamada apenas para a semana atual (a que contém hoje);
-- para semanas passadas/futuras use get_week_cards, que não dispara rollover.
create or replace function public.ensure_week_cards(p_token uuid, p_week_start date)
returns setof public.cards_agenda
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public.user_from_token(p_token);
  v_prev date;
begin
  if v_user is null then
    raise exception 'Sessão inválida';
  end if;

  -- O rollover roda no máximo uma vez por semana, por usuário.
  if not exists (
    select 1 from public.week_init_agenda
    where user_id = v_user and week_start = p_week_start
  ) then
    -- Só inicializa se a semana ainda não tem cards próprios, para não
    -- sobrescrever uma semana eventualmente já montada à mão.
    if not exists (
      select 1 from public.cards_agenda
      where user_id = v_user and week_start = p_week_start
    ) then
      -- Semana mais recente (antes da atual) que tenha cards.
      select max(week_start) into v_prev
      from public.cards_agenda
      where user_id = v_user and week_start < p_week_start;

      if v_prev is not null then
        insert into public.cards_agenda
          (user_id, week_start, dia, posicao, materia, conteudo, tipo, cor, concluido)
        select
          v_user,
          p_week_start,
          'backlog',
          (row_number() over (order by created_at asc, posicao asc)) - 1,
          materia,
          conteudo,
          tipo,
          cor,
          false
        from public.cards_agenda
        where user_id = v_user and week_start = v_prev;
      end if;
    end if;

    insert into public.week_init_agenda (user_id, week_start)
    values (v_user, p_week_start)
    on conflict do nothing;
  end if;

  return query
    select * from public.cards_agenda
    where user_id = v_user and week_start = p_week_start
    order by posicao asc, created_at asc;
end;
$$;

grant execute on function public.ensure_week_cards(uuid, date) to anon, authenticated;
