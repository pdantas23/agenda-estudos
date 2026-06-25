import { BoardState, CorMateria, DayColumn, StudyCard } from "./types";

export const BACKLOG_ID = "backlog";

export const DIAS: DayColumn[] = [
  { id: "seg", label: "Segunda", curto: "Seg" },
  { id: "ter", label: "Terça", curto: "Ter" },
  { id: "qua", label: "Quarta", curto: "Qua" },
  { id: "qui", label: "Quinta", curto: "Qui" },
  { id: "sex", label: "Sexta", curto: "Sex" },
  { id: "sab", label: "Sábado", curto: "Sáb" },
  { id: "dom", label: "Domingo", curto: "Dom" },
];

// Paleta de cores disponíveis para as matérias.
export const CORES: CorMateria[] = [
  "rose",
  "amber",
  "emerald",
  "sky",
  "violet",
  "fuchsia",
  "orange",
  "teal",
];

// Classes Tailwind por cor (precisam ser strings completas p/ o JIT detectar).
export const COR_CLASSES: Record<
  CorMateria,
  { borda: string; faixa: string; chip: string; chipTexto: string }
> = {
  rose: {
    borda: "border-rose-200",
    faixa: "bg-rose-400",
    chip: "bg-rose-100",
    chipTexto: "text-rose-700",
  },
  amber: {
    borda: "border-amber-200",
    faixa: "bg-amber-400",
    chip: "bg-amber-100",
    chipTexto: "text-amber-700",
  },
  emerald: {
    borda: "border-emerald-200",
    faixa: "bg-emerald-400",
    chip: "bg-emerald-100",
    chipTexto: "text-emerald-700",
  },
  sky: {
    borda: "border-sky-200",
    faixa: "bg-sky-400",
    chip: "bg-sky-100",
    chipTexto: "text-sky-700",
  },
  violet: {
    borda: "border-violet-200",
    faixa: "bg-violet-400",
    chip: "bg-violet-100",
    chipTexto: "text-violet-700",
  },
  fuchsia: {
    borda: "border-fuchsia-200",
    faixa: "bg-fuchsia-400",
    chip: "bg-fuchsia-100",
    chipTexto: "text-fuchsia-700",
  },
  orange: {
    borda: "border-orange-200",
    faixa: "bg-orange-400",
    chip: "bg-orange-100",
    chipTexto: "text-orange-700",
  },
  teal: {
    borda: "border-teal-200",
    faixa: "bg-teal-400",
    chip: "bg-teal-100",
    chipTexto: "text-teal-700",
  },
};

const card = (
  id: string,
  materia: string,
  conteudo: string,
  tipo: StudyCard["tipo"],
  cor: CorMateria,
): StudyCard => ({ id, materia, conteudo, tipo, cor, concluido: false });

// Estado inicial mock do board.
export const ESTADO_INICIAL: BoardState = {
  [BACKLOG_ID]: [
    card("c1", "Matemática", "Funções do 2º grau", "assunto", "sky"),
    card("c2", "Português", "Análise sintática — orações", "assunto", "rose"),
    card("c3", "Física", "Lista de cinemática (20 questões)", "questoes", "amber"),
    card("c4", "História", "Revolução Industrial", "assunto", "orange"),
  ],
  seg: [card("c5", "Química", "Ligações químicas", "assunto", "emerald")],
  ter: [],
  qua: [
    {
      ...card("c6", "Biologia", "Simulado de genética", "questoes", "violet"),
      concluido: true,
    },
  ],
  qui: [],
  sex: [card("c7", "Geografia", "Geopolítica mundial", "assunto", "teal")],
  sab: [],
  dom: [],
};
