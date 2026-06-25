# Agenda Semanal de Estudos

Aplicação para organizar as matérias da semana em um calendário estilo **kanban**: cadastre os assuntos/questões em cards e arraste-os para os dias da semana, acompanhando o que já foi concluído.

## Funcionalidades

- **Login** — tela simples de nome + senha (autenticação própria na tabela `users_agenda`). Cada usuário vê apenas a sua agenda.
- **Cadastro de matérias** — formulário com matéria, conteúdo (assunto ou questões) e cor.
- **Lista da semana** — cards de matérias ainda não agendados ficam na barra lateral esquerda.
- **Calendário kanban** — grade contígua de 7 dias (segunda a domingo) à direita.
- **Drag-and-drop** — arraste cards da lista para os dias, entre dias e reordene dentro de cada coluna.
- **Concluído** — marque cada card como concluído; cada dia mostra o progresso (`feitos/total`).
- **Navegação por semana** — avance/volte semanas; o dia de hoje é destacado.
- **Renovação automática da semana** — cada semana é identificada pela segunda-feira (`week_start`). Quando vira a semana, a agenda já aparece vazia (semanas antigas ficam guardadas no histórico) — sem nenhuma ação manual.
- **Persistência** — tudo é salvo no Supabase por usuário e por semana.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [dnd-kit](https://dndkit.com/) para o drag-and-drop

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. No **SQL Editor**, rode a migration `supabase/migrations/0001_init.sql` (cria as tabelas `users_agenda`, `sessions_agenda`, `cards_agenda` e as funções RPC de autenticação/dados).
3. Copie as credenciais (Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

   e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Sobre a segurança

A autenticação é própria (nome + senha). As senhas são guardadas com **hash bcrypt** (`pgcrypto`). As tabelas têm **RLS habilitado sem policies**, então a `anon key` não acessa nada diretamente — todo acesso passa por **funções RPC `SECURITY DEFINER`** que validam um **token de sessão**. Para um produto maior, o ideal é migrar para o Supabase Auth (JWT + RLS por `auth.uid()`).

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

Outros scripts:

```bash
npm run build   # build de produção
npm run start   # serve o build de produção
npm run lint    # ESLint
```

## Estrutura

```
src/
├─ app/
│  ├─ page.tsx          # rota protegida → Board (redireciona p/ /login)
│  ├─ login/page.tsx    # tela de login/cadastro
│  ├─ layout.tsx        # metadata, fontes e AuthProvider
│  └─ globals.css       # Tailwind
├─ components/
│  ├─ Board.tsx         # estado, drag-and-drop e sync com Supabase
│  ├─ Column.tsx        # coluna droppable (backlog e dias)
│  ├─ StudyCardItem.tsx # card de matéria arrastável
│  └─ AddCardForm.tsx   # formulário de cadastro
└─ lib/
   ├─ types.ts          # tipos (StudyCard, BoardState, etc.)
   ├─ mock.ts           # dias e paleta de cores
   ├─ date.ts           # helpers de data do calendário
   ├─ supabase.ts       # cliente Supabase
   ├─ auth.tsx          # AuthProvider/useAuth (login via RPC)
   └─ api.ts            # carregar/salvar cards da semana
supabase/
└─ migrations/
   └─ 0001_init.sql     # schema + funções RPC
```

## Próximos passos

- [ ] Migrar para Supabase Auth (RLS por `auth.uid()`)
- [ ] Mover pendências não concluídas entre semanas (opcional)
- [ ] Edição inline dos cards
