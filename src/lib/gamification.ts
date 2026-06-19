// Shared gamification constants and helpers

export const LEVELS = [
  { level: 1, title: 'Novato',       icon: '🌱', minPoints: 0,    color: '#94a3b8' },
  { level: 2, title: 'Aprendiz',     icon: '📚', minPoints: 200,  color: '#60a5fa' },
  { level: 3, title: 'Colaborador',  icon: '⚙️', minPoints: 500,  color: '#34d399' },
  { level: 4, title: 'Dedicado',     icon: '💪', minPoints: 1000, color: '#a78bfa' },
  { level: 5, title: 'Especialista', icon: '🔬', minPoints: 2000, color: '#fbbf24' },
  { level: 6, title: 'Elite',        icon: '👑', minPoints: 4000, color: '#f97316' },
] as const

export function getLevelInfo(level: number) {
  return LEVELS.find(l => l.level === level) ?? LEVELS[0]
}

export function getNextLevel(level: number) {
  return LEVELS.find(l => l.level === level + 1) ?? null
}

export function getProgressToNextLevel(points: number, level: number): number {
  const current = LEVELS.find(l => l.level === level)
  const next    = LEVELS.find(l => l.level === level + 1)
  if (!current || !next) return 100
  const range = next.minPoints - current.minPoints
  const done  = points - current.minPoints
  return Math.min(100, Math.round((done / range) * 100))
}

export const ACHIEVEMENTS: Record<string, { label: string; emoji: string; desc: string }> = {
  first_day:     { label: 'Primeiro Dia',     emoji: '🌱', desc: 'Primeiro registro de ponto' },
  streak_3:      { label: 'Trio Imparável',   emoji: '🔥', desc: '3 dias consecutivos' },
  streak_7:      { label: 'Semana Perfeita',  emoji: '⚡', desc: '7 dias consecutivos' },
  streak_30:     { label: 'Mês Inquebrável',  emoji: '💎', desc: '30 dias consecutivos' },
  punctual_10:   { label: 'Sempre Pontual',   emoji: '⏰', desc: '10 entradas no horário' },
  month_80:      { label: 'Quase Lá',         emoji: '🚀', desc: '80% da carga horária mensal' },
  month_complete:{ label: 'Meta Cumprida',    emoji: '🏆', desc: '100% da carga horária mensal' },
  top_month:     { label: 'Destaque do Mês',  emoji: '👑', desc: '1º lugar no ranking mensal' },
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0
  if (streak >= 7)  return 1.5
  if (streak >= 3)  return 1.2
  return 1.0
}

export function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
