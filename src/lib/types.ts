export type ColumnId = string;

export type CardTipo = "assunto" | "questoes";

export interface StudyCard {
  id: string;
  materia: string;
  conteudo: string;
  tipo: CardTipo;
  cor: CorMateria;
  concluido: boolean;
}

export type CorMateria =
  | "rose"
  | "amber"
  | "emerald"
  | "sky"
  | "violet"
  | "fuchsia"
  | "orange"
  | "teal";

export interface DayColumn {
  id: ColumnId;
  label: string;
  curto: string;
}

// Estado do board: para cada coluna, a lista ordenada de cards.
export type BoardState = Record<ColumnId, StudyCard[]>;
