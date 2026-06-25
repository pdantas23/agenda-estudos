"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { BACKLOG_ID, DIAS } from "@/lib/mock";
import {
  addDays,
  formatWeekRange,
  mesmaData,
  startOfWeekMonday,
  toISODate,
} from "@/lib/date";
import { fetchWeek, saveWeek } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BoardState, ColumnId, StudyCard } from "@/lib/types";
import AddCardForm from "./AddCardForm";
import Column from "./Column";
import StudyCardItem from "./StudyCardItem";

const emptyBoard = (): BoardState => ({
  [BACKLOG_ID]: [],
  ...Object.fromEntries(DIAS.map((d) => [d.id, []])),
});

export default function Board() {
  const { session, logout } = useAuth();

  const [board, setBoard] = useState<BoardState>(emptyBoard);
  const [offset, setOffset] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // boardRef espelha o estado para cálculos síncronos durante o arraste.
  const boardRef = useRef<BoardState>(board);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Relógio do sistema (client-only). É reavaliado periodicamente para que,
  // na virada da semana, a semana atual passe a apontar para a nova segunda
  // — a renovação automática.
  const [agora, setAgora] = useState<{ monday: Date; hoje: Date } | null>(null);
  useEffect(() => {
    const compute = () => ({
      monday: startOfWeekMonday(new Date()),
      hoje: new Date(),
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura inicial do relógio
    setAgora(compute());

    const tick = () =>
      setAgora((prev) => {
        const next = compute();
        return prev && toISODate(prev.monday) === toISODate(next.monday)
          ? prev
          : next;
      });
    const id = setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const hoje = agora?.hoje ?? null;
  const weekStart = useMemo(
    () => (agora ? addDays(agora.monday, offset * 7) : null),
    [agora, offset],
  );
  const weekISO = useMemo(
    () => (weekStart ? toISODate(weekStart) : null),
    [weekStart],
  );

  // Carrega os cards da semana visível sempre que a semana ou a sessão mudam.
  useEffect(() => {
    if (!session || !weekISO) return;
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- início do carregamento
    setCarregando(true);
    setErro(null);
    fetchWeek(session.token, weekISO)
      .then((b) => {
        if (cancelado) return;
        boardRef.current = b;
        setBoard(b);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          setErro(e instanceof Error ? e.message : "Erro ao carregar a semana");
        }
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [session, weekISO]);

  // Persiste o snapshot da semana (debounce).
  const scheduleSave = useCallback(
    (next: BoardState) => {
      if (!session || !weekISO) return;
      const token = session.token;
      const iso = weekISO;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveWeek(token, iso, next).catch((e: unknown) =>
          setErro(e instanceof Error ? e.message : "Erro ao salvar"),
        );
      }, 500);
    },
    [session, weekISO],
  );

  // Aplica um novo board (render + ref) e, opcionalmente, agenda a persistência.
  const applyBoard = useCallback(
    (next: BoardState, persist = true) => {
      boardRef.current = next;
      setBoard(next);
      if (persist) scheduleSave(next);
    },
    [scheduleSave],
  );

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

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointer = pointerWithin(args);
      const intersections =
        pointer.length > 0 ? pointer : rectIntersection(args);
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
    const b = boardRef.current;
    if (id in b) return id;
    return Object.keys(b).find((col) => b[col].some((c) => c.id === id)) ?? null;
  }

  const handleToggle = (id: string) => {
    const b = boardRef.current;
    const next: BoardState = {};
    for (const [col, cards] of Object.entries(b)) {
      next[col] = cards.map((c) =>
        c.id === id ? { ...c, concluido: !c.concluido } : c,
      );
    }
    applyBoard(next);
  };

  const handleRemove = (id: string) => {
    const b = boardRef.current;
    const next: BoardState = {};
    for (const [col, cards] of Object.entries(b)) {
      next[col] = cards.filter((c) => c.id !== id);
    }
    applyBoard(next);
  };

  const handleAdd = (card: StudyCard) => {
    const b = boardRef.current;
    applyBoard({ ...b, [BACKLOG_ID]: [card, ...b[BACKLOG_ID]] });
  };

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;

    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    const b = boardRef.current;
    const activeItems = b[activeCol];
    const overItems = b[overCol];
    const moving = activeItems.find((c) => c.id === active.id);
    if (!moving) return;

    const overIndex = overItems.findIndex((c) => c.id === over.id);
    const insertAt = overIndex >= 0 ? overIndex : overItems.length;

    applyBoard(
      {
        ...b,
        [activeCol]: activeItems.filter((c) => c.id !== active.id),
        [overCol]: [
          ...overItems.slice(0, insertAt),
          moving,
          ...overItems.slice(insertAt),
        ],
      },
      false, // não persiste durante o arraste
    );
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) {
      scheduleSave(boardRef.current);
      return;
    }

    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    const b = boardRef.current;

    if (activeCol && overCol && activeCol === overCol) {
      const items = b[activeCol];
      const from = items.findIndex((c) => c.id === active.id);
      const to = items.findIndex((c) => c.id === over.id);
      if (from !== to && to >= 0) {
        applyBoard({ ...b, [activeCol]: arrayMove(items, from, to) });
        return;
      }
    }
    // Sem reordenação (ex.: só trocou de coluna no dragOver): persiste o atual.
    scheduleSave(b);
  }

  if (!agora || !session) {
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Olá, <strong className="text-slate-700">{session.nome}</strong>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </header>

        {erro && (
          <p className="bg-red-50 px-6 py-2 text-xs text-red-600">{erro}</p>
        )}

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
                  {carregando && (
                    <span className="text-[11px] text-slate-400">
                      carregando…
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
