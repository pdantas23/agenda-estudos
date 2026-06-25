"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { BACKLOG_ID, DIAS, ESTADO_INICIAL } from "@/lib/mock";
import {
  addDays,
  formatWeekRange,
  mesmaData,
  startOfWeekMonday,
} from "@/lib/date";
import { BoardState, ColumnId, StudyCard } from "@/lib/types";
import AddCardForm from "./AddCardForm";
import Column from "./Column";
import StudyCardItem from "./StudyCardItem";

const emptyBoard = (): BoardState => ({
  [BACKLOG_ID]: [],
  ...Object.fromEntries(DIAS.map((d) => [d.id, []])),
});

export default function Board() {
  // Cada semana (offset relativo à atual) tem seu próprio board.
  // offset 0 = semana atual, com o conteúdo mock; demais começam vazias.
  const [boards, setBoards] = useState<Record<number, BoardState>>({
    0: ESTADO_INICIAL,
  });
  const [offset, setOffset] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Datas vêm do relógio do sistema, então são lidas apenas no client
  // (após mount) para evitar divergência de hidratação servidor/navegador.
  const [agora, setAgora] = useState<{ monday: Date; hoje: Date } | null>(null);
  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o relógio (client-only)
    setAgora({ monday: startOfWeekMonday(d), hoje: d });
  }, []);

  const hoje = agora?.hoje ?? null;
  const weekStart = agora ? addDays(agora.monday, offset * 7) : null;
  const board = boards[offset] ?? emptyBoard();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    for (const col of Object.values(board)) {
      const found = col.find((c) => c.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, board]);

  // Atualiza o board da semana atualmente visível.
  function updateCurrent(fn: (b: BoardState) => BoardState) {
    setBoards((prev) => ({
      ...prev,
      [offset]: fn(prev[offset] ?? emptyBoard()),
    }));
  }

  // Detecção de colisão baseada no ponteiro (e não no retângulo do card,
  // que é largo e invadiria a coluna vizinha). Quando o cursor está sobre
  // uma coluna, refina para o card mais próximo dentro dela.
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointer = pointerWithin(args);
      const intersections = pointer.length > 0 ? pointer : rectIntersection(args);
      let overId = getFirstCollision(intersections, "id");

      if (overId != null) {
        if (typeof overId === "string" && overId in board) {
          const itemIds = board[overId].map((c) => c.id);
          if (itemIds.length > 0) {
            const closest = closestCenter({
              ...args,
              droppableContainers: args.droppableContainers.filter(
                (container) =>
                  container.id !== overId &&
                  itemIds.includes(String(container.id)),
              ),
            })[0];
            if (closest) overId = closest.id;
          }
        }
        return [{ id: overId }];
      }
      return [];
    },
    [board],
  );

  function findColumn(id: string): ColumnId | null {
    if (id in board) return id;
    return (
      Object.keys(board).find((col) => board[col].some((c) => c.id === id)) ??
      null
    );
  }

  const handleToggle = (id: string) =>
    updateCurrent((b) => {
      const next: BoardState = {};
      for (const [col, cards] of Object.entries(b)) {
        next[col] = cards.map((c) =>
          c.id === id ? { ...c, concluido: !c.concluido } : c,
        );
      }
      return next;
    });

  const handleRemove = (id: string) =>
    updateCurrent((b) => {
      const next: BoardState = {};
      for (const [col, cards] of Object.entries(b)) {
        next[col] = cards.filter((c) => c.id !== id);
      }
      return next;
    });

  const handleAdd = (card: StudyCard) =>
    updateCurrent((b) => ({ ...b, [BACKLOG_ID]: [card, ...b[BACKLOG_ID]] }));

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    updateCurrent((b) => {
      const activeItems = b[activeCol];
      const overItems = b[overCol];
      const moving = activeItems.find((c) => c.id === active.id);
      if (!moving) return b;

      const overIndex = overItems.findIndex((c) => c.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...b,
        [activeCol]: activeItems.filter((c) => c.id !== active.id),
        [overCol]: [
          ...overItems.slice(0, insertAt),
          moving,
          ...overItems.slice(insertAt),
        ],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    if (!activeCol || !overCol || activeCol !== overCol) return;

    const items = board[activeCol];
    const from = items.findIndex((c) => c.id === active.id);
    const to = items.findIndex((c) => c.id === over.id);
    if (from === to || to < 0) return;

    updateCurrent((b) => ({
      ...b,
      [activeCol]: arrayMove(b[activeCol], from, to),
    }));
  }

  // O DndContext gera ids internos que divergem entre servidor e client,
  // causando erro de hidratação. Por isso só renderizamos após o mount
  // (quando `agora` foi lido do relógio).
  if (!agora) {
    return <div className="h-screen bg-slate-50" />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col bg-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Agenda de Estudos
            </h1>
            <p className="text-xs text-slate-400">
              Arraste as matérias para os dias da semana
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            Versão mock
          </span>
        </header>

        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Sidebar esquerda: cadastro + lista de cards */}
          <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-hidden">
            <AddCardForm onAdd={handleAdd} />
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3">
              <h2 className="mb-2 px-1 text-sm font-semibold text-slate-600">
                Matérias da semana
                <span className="ml-1.5 text-slate-400">
                  ({board[BACKLOG_ID].length})
                </span>
              </h2>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Column
                  id={BACKLOG_ID}
                  cards={board[BACKLOG_ID]}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                  variant="backlog"
                />
              </div>
            </div>
          </aside>

          {/* Calendário semanal kanban */}
          <main className="flex min-w-0 flex-1 flex-col gap-3">
            {/* Barra de navegação de semana */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOffset((o) => o - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  aria-label="Semana anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setOffset((o) => o + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                  aria-label="Próxima semana"
                >
                  ›
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-700">
                    {weekStart ? formatWeekRange(weekStart) : "—"}
                  </h2>
                  {offset === 0 && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      Semana atual
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOffset(0)}
                disabled={offset === 0}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hoje
              </button>
            </div>

            {/* Grade do calendário (7 colunas contíguas) */}
            <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {DIAS.map((dia, i) => {
                const dataDia = weekStart ? addDays(weekStart, i) : null;
                const isToday =
                  dataDia && hoje ? mesmaData(dataDia, hoje) : false;
                const cards = board[dia.id];
                const done = cards.filter((c) => c.concluido).length;

                return (
                  <div
                    key={dia.id}
                    className="flex min-w-0 flex-1 flex-col border-l border-slate-200 first:border-l-0"
                  >
                    {/* Cabeçalho do dia */}
                    <div
                      className={`flex items-center justify-between border-b px-2.5 py-2 ${
                        isToday
                          ? "border-indigo-200 bg-indigo-50"
                          : "border-slate-100 bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-xs font-semibold ${
                            isToday ? "text-indigo-700" : "text-slate-600"
                          }`}
                        >
                          {dia.curto}
                        </span>
                        {dataDia && (
                          <span
                            className={`text-xs ${
                              isToday
                                ? "font-bold text-indigo-700"
                                : "text-slate-400"
                            }`}
                          >
                            {dataDia.getDate()}
                          </span>
                        )}
                      </div>
                      {cards.length > 0 && (
                        <span className="rounded-full bg-slate-200/70 px-1.5 text-[10px] font-medium text-slate-500">
                          {done}/{cards.length}
                        </span>
                      )}
                    </div>

                    {/* Área de cards (scroll por dia) */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30">
                      <Column
                        id={dia.id}
                        cards={cards}
                        onToggle={handleToggle}
                        onRemove={handleRemove}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <StudyCardItem
            card={activeCard}
            onToggle={() => {}}
            onRemove={() => {}}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
