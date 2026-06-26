import { CardTipo, CorMateria, DayColumn } from "./types";

export const BACKLOG_ID = "backlog";

// Categorias (tipo) disponíveis para um card, na ordem exibida no dropdown.
export const TIPOS: { value: CardTipo; label: string }[] = [
  { value: "assunto", label: "Assunto" },
  { value: "questoes", label: "Questões" },
  { value: "revisao", label: "Revisão" },
  { value: "mapeamento", label: "Mapeamento" },
];

export const TIPO_LABELS = Object.fromEntries(
  TIPOS.map((t) => [t.value, t.label]),
) as Record<CardTipo, string>;

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
