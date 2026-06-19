// Shared gamification constants and helpers

export const SCORING_RULES = [
  { id: 'presence',  emoji: '📅', label: 'Presença diária',       points: '+10 pts', detail: 'Compareça e registre entrada e saída no mesmo dia' },
  { id: 'punctual',  emoji: '⏰', label: 'Pontualidade',           points: '+5 pts',  detail: 'Registre a entrada em até 15 min após o horário previsto' },
  { id: 'photo',     emoji: '📸', label: 'Foto de perfil',         points: '+30 pts', detail: 'Cadastre uma foto sua (real, não desenho) em Meu Perfil — concedido apenas na primeira vez' },
  { id: 'activity',  emoji: '📝', label: 'Atividade documentada',  points: '+5 pts',  detail: 'Na saída, descreva ao menos 1 atividade realizada (mín. 10 letras)' },
  { id: 'fullname',  emoji: '🪪', label: 'Nome completo válido',  points: '+20 pts', detail: 'Cadastre seu nome completo sem abreviações (ex: "Emanuel M" não vale — coloque "Emanuel Maestre")' },
  { id: 'streak_3',  emoji: '🔥', label: 'Sequência de 3 dias',   points: '×1.2',    detail: 'Compareça 3 dias seguidos — multiplica os pontos do dia' },
  { id: 'streak_7',  emoji: '⚡', label: 'Sequência de 7 dias',   points: '×1.5',    detail: 'Compareça 7 dias seguidos — multiplica os pontos do dia' },
  { id: 'streak_30', emoji: '💎', label: 'Sequência de 30 dias',  points: '×2.0',    detail: 'Compareça 30 dias seguidos — dobra os pontos do dia' },
] as const

export const LEVELS = [
  { level: 1, titleM: 'Novato',       titleF: 'Novata',        icon: '🌱', minPoints: 0,    color: '#94a3b8' },
  { level: 2, titleM: 'Aprendiz',     titleF: 'Aprendiz',      icon: '📚', minPoints: 200,  color: '#60a5fa' },
  { level: 3, titleM: 'Colaborador',  titleF: 'Colaboradora',  icon: '🤝', minPoints: 500,  color: '#34d399' },
  { level: 4, titleM: 'Dedicado',     titleF: 'Dedicada',      icon: '💪', minPoints: 1000, color: '#a78bfa' },
  { level: 5, titleM: 'Especialista', titleF: 'Especialista',  icon: '🔬', minPoints: 2000, color: '#fbbf24' },
  { level: 6, titleM: 'Elite',        titleF: 'Elite',         icon: '👑', minPoints: 4000, color: '#f97316' },
] as const

export type LevelEntry = typeof LEVELS[number]

/** Retorna o objeto do nível. Use getLevelTitle() para obter o título com gênero. */
export function getLevelInfo(level: number): LevelEntry & { title: string } {
  const lvl = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  return { ...lvl, title: lvl.titleM }
}

/** Retorna o título do nível no gênero correto. gender = 'F' | 'M' | null */
export function getLevelTitle(level: number, gender: 'F' | 'M' | null): string {
  const lvl = LEVELS.find(l => l.level === level) ?? LEVELS[0]
  return gender === 'F' ? lvl.titleF : lvl.titleM
}


export function getNextLevel(level: number): (LevelEntry & { title: string }) | null {
  const lvl = LEVELS.find(l => l.level === level + 1) ?? null
  if (!lvl) return null
  return { ...lvl, title: lvl.titleM }
}

export function getProgressToNextLevel(points: number, level: number): number {
  const current = LEVELS.find(l => l.level === level)
  const next    = LEVELS.find(l => l.level === level + 1)
  if (!current || !next) return 100
  const range = next.minPoints - current.minPoints
  const done  = points - current.minPoints
  return Math.min(100, Math.round((done / range) * 100))
}

export const ACHIEVEMENTS: Record<string, { label: string; emoji: string; desc: string; how: string }> = {
  full_name: {
    label: 'Nome Verdadeiro',
    emoji: '🪪',
    desc:  'Nome completo cadastrado sem abreviações',
    how:   'Preencha seu nome completo em Meu Perfil sem abreviar — "Emanuel M dos Santos" não vale, escreva "Emanuel Maestre dos Santos"',
  },
  has_photo: {
    label: 'Identidade Completa',
    emoji: '📸',
    desc:  'Foto real de perfil cadastrada (apenas na primeira vez)',
    how:   'Vá em Meu Perfil e adicione uma foto sua real — trocar a foto depois não concede pontos novamente e fotos de desenho/avatar não são válidas',
  },
  first_day: {
    label: 'Primeiro Dia',
    emoji: '🌱',
    desc:  'Primeiro registro de ponto concluído',
    how:   'Registre entrada e saída pela primeira vez',
  },
  streak_3: {
    label: 'Trio Imparável',
    emoji: '🔥',
    desc:  '3 dias consecutivos presentes',
    how:   'Compareça e registre ponto por 3 dias seguidos',
  },
  streak_7: {
    label: 'Semana Perfeita',
    emoji: '⚡',
    desc:  '7 dias consecutivos presentes',
    how:   'Compareça e registre ponto por 7 dias seguidos sem faltar',
  },
  streak_30: {
    label: 'Mês Inquebrável',
    emoji: '💎',
    desc:  '30 dias consecutivos presentes',
    how:   'Compareça e registre ponto por 30 dias seguidos sem faltar',
  },
  punctual_10: {
    label: 'Sempre Pontual',
    emoji: '⏰',
    desc:  '10 entradas registradas no horário',
    how:   'Registre a entrada em até 15 min do horário previsto por 10 vezes',
  },
  reporter_5: {
    label: 'Repórter',
    emoji: '📝',
    desc:  '5 saídas com atividade documentada',
    how:   'Na tela de saída, descreva o que fez (mín. 10 letras) em 5 dias diferentes',
  },
  reporter_20: {
    label: 'Cronista',
    emoji: '📋',
    desc:  '20 saídas com atividade documentada',
    how:   'Na tela de saída, descreva o que fez (mín. 10 letras) em 20 dias diferentes',
  },
  month_80: {
    label: 'Quase Lá',
    emoji: '🚀',
    desc:  '80% da carga horária mensal atingida',
    how:   'Cumpra ao menos 80% das horas do mês registrando entrada e saída',
  },
  month_complete: {
    label: 'Meta Cumprida',
    emoji: '🏆',
    desc:  '100% da carga horária mensal atingida',
    how:   'Cumpra 100% das horas do mês registrando entrada e saída todos os dias',
  },
  top_month: {
    label: 'Destaque do Mês',
    emoji: '👑',
    desc:  '1º lugar no ranking do mês',
    how:   'Seja o estagiário com mais pontos no mês — presença, pontualidade e atividades',
  },
}

/**
 * Retorna true se o nome completo parece válido:
 * - ao menos 2 palavras significativas (excluindo preposições)
 * - nenhuma palavra significativa é abreviada (letra única)
 */
export function isFullNameComplete(name: string): boolean {
  const PREPOSITIONS = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'di', 'del', 'van', 'von'])
  const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const significant = words.filter(w => !PREPOSITIONS.has(w))
  if (significant.length < 2) return false
  return significant.every(w => w.length > 1)
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
