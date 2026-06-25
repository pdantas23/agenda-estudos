"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { StudyCard } from "@/lib/types";
import StudyCardItem from "./StudyCardItem";

interface Props {
  id: string;
  cards: StudyCard[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  /** Coluna de dia (preenche a célula) ou backlog (lista simples). */
  variant?: "dia" | "backlog";
}

export default function Column({
  id,
  cards,
  onToggle,
  onRemove,
  variant = "dia",
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex flex-col gap-2 rounded-md p-1 transition-colors",
        variant === "dia" ? "min-h-full" : "min-h-24",
        isOver ? "bg-indigo-50 ring-2 ring-indigo-300/70 ring-inset" : "",
      ].join(" ")}
    >
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {cards.map((card) => (
          <StudyCardItem
            key={card.id}
            card={card}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>

      {cards.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-200 py-6 text-xs text-slate-300">
          Solte aqui
        </div>
      )}
    </div>
  );
}
