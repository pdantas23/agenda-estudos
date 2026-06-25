"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COR_CLASSES } from "@/lib/mock";
import { StudyCard } from "@/lib/types";

interface Props {
  card: StudyCard;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  /** Quando true, renderiza só a aparência (usado no DragOverlay). */
  overlay?: boolean;
}

export default function StudyCardItem({
  card,
  onToggle,
  onRemove,
  overlay,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: overlay });

  const cores = COR_CLASSES[card.cor];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[
        "group relative flex w-full flex-col gap-1.5 rounded-lg border bg-white p-3 pl-4",
        "cursor-grab active:cursor-grabbing select-none",
        cores.borda,
        isDragging && !overlay ? "opacity-40" : "",
        overlay ? "rotate-2 shadow-lg" : "",
        card.concluido ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* faixa de cor da matéria */}
      <span
        className={`absolute left-0 top-0 h-full w-1.5 rounded-l-lg ${cores.faixa}`}
      />

      <div className="flex items-start justify-between gap-2">
        <span
          className={`min-w-0 break-words rounded-md px-1.5 py-0.5 text-xs font-semibold ${cores.chip} ${cores.chipTexto}`}
        >
          {card.materia}
        </span>
        <button
          type="button"
          onClick={() => onRemove(card.id)}
          className="shrink-0 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
          aria-label="Remover card"
        >
          ✕
        </button>
      </div>

      <p
        className={`text-sm text-slate-700 ${
          card.concluido ? "line-through" : ""
        }`}
      >
        {card.conteudo}
      </p>

      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {card.tipo === "questoes" ? "Questões" : "Assunto"}
      </span>

      <div className="mt-0.5 border-t border-slate-100 pt-1.5">
        <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={card.concluido}
            onChange={() => onToggle(card.id)}
            className="h-3.5 w-3.5 accent-emerald-500"
          />
          Concluído
        </label>
      </div>
    </div>
  );
}
