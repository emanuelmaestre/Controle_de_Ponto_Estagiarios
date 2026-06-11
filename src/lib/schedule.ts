// ──────────────────────────────────────────────────────────
// Cálculo de horas do cronograma (turnos por dia)
// Fonte única de verdade — usada no frontend (editor) e em
// qualquer leitura/validação. Evita duplicação de lógica.
// ──────────────────────────────────────────────────────────

export interface TimeInterval {
  start: string // "HH:MM"
  end: string   // "HH:MM"
}

/** Converte "HH:MM" em minutos desde 00:00. Retorna null se incompleto/inválido. */
export function timeToMinutes(t: string): number | null {
  if (!t || !/^\d{2}:\d{2}/.test(t)) return null
  const [h, m] = t.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * Duração de um turno em minutos.
 * Retorna null se algum horário estiver vazio (incompleto) ou se a
 * saída for anterior ou igual à entrada (inválido — sem suporte a virada de dia).
 */
export function slotMinutes(start: string, end: string): number | null {
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  if (s === null || e === null) return null
  if (e <= s) return null
  return e - s
}

/**
 * Soma a duração de um dia em minutos, UNINDO turnos sobrepostos
 * para nunca contabilizar o mesmo intervalo duas vezes.
 * Ex.: 09:00–12:00 + 10:00–11:00 = 180 min (não 240).
 */
export function dayMinutes(intervals: TimeInterval[]): number {
  const valid = intervals
    .map(i => {
      const s = timeToMinutes(i.start)
      const e = timeToMinutes(i.end)
      return s !== null && e !== null && e > s ? { s, e } : null
    })
    .filter((x): x is { s: number; e: number } => x !== null)
    .sort((a, b) => a.s - b.s)

  let total = 0
  let curStart = -1
  let curEnd = -1
  for (const { s, e } of valid) {
    if (s > curEnd) {
      // novo bloco sem sobreposição com o anterior
      if (curEnd >= 0) total += curEnd - curStart
      curStart = s
      curEnd = e
    } else {
      // sobrepõe ou encosta — estende o bloco atual
      curEnd = Math.max(curEnd, e)
    }
  }
  if (curEnd >= 0) total += curEnd - curStart
  return total
}

/** Soma semanal (segunda a domingo) a partir dos turnos agrupados por dia. */
export function weeklyMinutes(byDay: Record<number, TimeInterval[]>): number {
  return Object.values(byDay).reduce((sum, intervals) => sum + dayMinutes(intervals), 0)
}

/**
 * Formata minutos como "0h", "2h", "11h45".
 * Nunca usa decimais (ex.: nunca "11,75h").
 */
export function formatHm(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}
