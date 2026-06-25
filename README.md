# Agenda Semanal de Estudos

Aplicação para organizar as matérias da semana em um calendário estilo **kanban**: cadastre os assuntos/questões em cards e arraste-os para os dias da semana, acompanhando o que já foi concluído.

> ⚠️ **Versão mock.** Os dados ficam apenas em memória (reiniciam ao recarregar a página). Login, persistência e backend (Supabase) serão adicionados nas próximas etapas.

## Funcionalidades

- **Cadastro de matérias** — formulário com matéria, conteúdo (assunto ou questões) e cor.
- **Lista da semana** — cards de matérias ainda não agendados ficam na barra lateral esquerda.
- **Calendário kanban** — grade contígua de 7 dias (segunda a domingo) à direita.
- **Drag-and-drop** — arraste cards da lista para os dias, entre dias e reordene dentro de cada coluna.
- **Concluído** — marque cada card como concluído; cada dia mostra o progresso (`feitos/total`).
- **Navegação por semana** — avance/volte semanas; a semana atual carrega o mock e as demais começam vazias (gancho para a futura renovação semanal). O dia de hoje é destacado.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [dnd-kit](https://dndkit.com/) para o drag-and-drop

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
│  ├─ page.tsx          # renderiza o Board
│  ├─ layout.tsx        # metadata e fontes
│  └─ globals.css       # Tailwind
├─ components/
│  ├─ Board.tsx         # estado + lógica de drag-and-drop
│  ├─ Column.tsx        # coluna droppable (backlog e dias)
│  ├─ StudyCardItem.tsx # card de matéria arrastável
│  └─ AddCardForm.tsx   # formulário de cadastro
└─ lib/
   ├─ types.ts          # tipos (StudyCard, BoardState, etc.)
   ├─ mock.ts           # dados iniciais, dias e paleta de cores
   └─ date.ts           # helpers de data do calendário
```

## Próximos passos

- [ ] Tela de login
- [ ] Persistência (localStorage e, depois, Supabase)
- [ ] Backend e migrations (Supabase)
- [ ] Renovação automática da semana
