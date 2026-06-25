import { getSupabase } from "./supabase";
import { BACKLOG_ID, DIAS } from "./mock";
import { BoardState, CardTipo, CorMateria, StudyCard } from "./types";

// Linha da tabela cards_agenda (campos relevantes).
interface CardRow {
  id: string;
  dia: string;
  posicao: number;
  materia: string;
  conteudo: string;
  tipo: CardTipo;
  cor: CorMateria;
  concluido: boolean;
}

const emptyBoard = (): BoardState => ({
  [BACKLOG_ID]: [],
  ...Object.fromEntries(DIAS.map((d) => [d.id, []])),
});

/** Carrega os cards de uma semana e os agrupa por coluna. */
export async function fetchWeek(
  token: string,
  weekStartISO: string,
): Promise<BoardState> {
  const { data, error } = await getSupabase().rpc("get_week_cards", {
    p_token: token,
    p_week_start: weekStartISO,
  });
  if (error) throw new Error(error.message);

  const board = emptyBoard();
  for (const row of (data as CardRow[]) ?? []) {
    const card: StudyCard = {
      id: row.id,
      materia: row.materia,
      conteudo: row.conteudo,
      tipo: row.tipo,
      cor: row.cor,
      concluido: row.concluido,
    };
    (board[row.dia] ?? board[BACKLOG_ID]).push(card);
  }
  return board;
}

/** Salva (substitui) todos os cards da semana a partir do estado do board. */
export async function saveWeek(
  token: string,
  weekStartISO: string,
  board: BoardState,
): Promise<void> {
  const payload = Object.entries(board).flatMap(([dia, cards]) =>
    cards.map((c, posicao) => ({ ...c, dia, posicao })),
  );

  const { error } = await getSupabase().rpc("save_week_cards", {
    p_token: token,
    p_week_start: weekStartISO,
    p_cards: payload,
  });
  if (error) throw new Error(error.message);
}
