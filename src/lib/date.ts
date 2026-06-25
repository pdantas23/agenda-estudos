// Helpers de data usados pelo calendário (rodam só no client após mount,
// para evitar divergência de hidratação entre servidor e navegador).

/** Segunda-feira (00:00) da semana que contém a data informada. */
export function startOfWeekMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = date.getDay(); // 0 = domingo ... 6 = sábado
  const diff = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + diff);
  return date;
}

/** Data local no formato YYYY-MM-DD (sem conversão p/ UTC). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function mesmaData(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Ex.: "22 – 28 de jun. 2026" (ou cruzando meses: "29 jun. – 5 jul. 2026"). */
export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const m1 = monday.toLocaleDateString("pt-BR", { month: "short" });
  const m2 = sunday.toLocaleDateString("pt-BR", { month: "short" });
  const ano = sunday.getFullYear();

  if (m1 === m2) {
    return `${monday.getDate()} – ${sunday.getDate()} de ${m1} ${ano}`;
  }
  return `${monday.getDate()} ${m1} – ${sunday.getDate()} ${m2} ${ano}`;
}
