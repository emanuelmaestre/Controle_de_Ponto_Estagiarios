// Shared gamification constants and helpers

export const SCORING_RULES = [
  // ── Presença ──
  { id: 'presence',         emoji: '📅', label: 'Presença diária',           points: '+10 pts', detail: 'Compareça e registre entrada e saída no mesmo dia' },
  { id: 'punctual',         emoji: '⏰', label: 'Pontualidade',               points: '+5 pts',  detail: 'Registre a entrada em até 15 min após o horário previsto' },
  { id: 'activity',         emoji: '📝', label: 'Atividade documentada',      points: '+5 pts',  detail: 'Na saída, descreva ao menos 1 atividade realizada (mín. 10 letras)' },
  { id: 'session_complete', emoji: '✅', label: 'Sessão completa',             points: '+3 pts',  detail: 'Cumpra todas as horas agendadas do dia (tolerância de 10 min)' },
  // ── Cadastro ──
  { id: 'photo',            emoji: '📸', label: 'Foto de perfil',             points: '+30 pts', detail: 'Cadastre uma foto sua (real, não desenho) em Meu Perfil — concedido apenas na primeira vez' },
  { id: 'fullname',         emoji: '🪪', label: 'Nome completo válido',       points: '+20 pts', detail: 'Cadastre seu nome completo sem abreviações (ex: "Emanuel M" não vale — coloque "Emanuel Maestre")' },
  // ── Streak ──
  { id: 'streak_3',         emoji: '🔥', label: 'Sequência de 3 dias',       points: '×1.2',    detail: 'Compareça 3 dias seguidos — multiplica todos os pontos do dia' },
  { id: 'streak_7',         emoji: '⚡', label: 'Sequência de 7 dias',       points: '×1.5',    detail: 'Compareça 7 dias seguidos — multiplica todos os pontos do dia' },
  { id: 'streak_30',        emoji: '💎', label: 'Sequência de 30 dias',      points: '×2.0',    detail: 'Compareça 30 dias seguidos — dobra todos os pontos do dia' },
  // ── Carga horária ──
  { id: 'workload_25',      emoji: '⏳', label: '25% da carga cumprida',     points: '+50 pts', detail: 'Atinja 25% do total de horas do seu estágio' },
  { id: 'workload_50',      emoji: '⌛', label: '50% da carga cumprida',     points: '+100 pts', detail: 'Atinja a metade do total de horas do seu estágio' },
  { id: 'workload_75',      emoji: '🎯', label: '75% da carga cumprida',     points: '+150 pts', detail: 'Atinja 75% do total de horas do seu estágio' },
  { id: 'workload_100',     emoji: '🏁', label: 'Carga horária concluída',   points: '+250 pts', detail: 'Conclua 100% das horas exigidas pelo seu estágio' },
  // ── Feedback ──
  { id: 'feedback_sent',        emoji: '💬', label: 'Feedback enviado',          points: '+100 pts', detail: 'Envie uma sugestão, elogio ou reporte um problema pelo painel' },
  { id: 'feedback_implemented', emoji: '🛠️', label: 'Feedback implementado',     points: '+100 pts', detail: 'Seu feedback foi marcado como implementado pelo administrador' },
  { id: 'feedback_highlight',   emoji: '⭐', label: 'Feedback destaque',         points: '+100 pts', detail: 'Seu feedback foi destacado pelo administrador como excelente' },
  // ── Consistência mensal ──
  { id: 'month_60',         emoji: '📈', label: '60% do mês cumprido',       points: '+20 pts', detail: 'Cumpra ao menos 60% das horas esperadas no mês' },
  { id: 'month_80',         emoji: '🚀', label: '80% do mês cumprido',       points: '+40 pts', detail: 'Cumpra ao menos 80% das horas esperadas no mês' },
  { id: 'month_complete',   emoji: '🏆', label: 'Mês 100% cumprido',         points: '+60 pts', detail: 'Cumpra 100% das horas esperadas em um mês' },
  { id: 'month_110',        emoji: '🌟', label: 'Dedicação extra no mês',    points: '+80 pts', detail: 'Cumpra mais de 110% das horas esperadas em um mês' },
] as const

export const LEVELS = [
  { level: 1, titleM: 'Novato',       titleF: 'Novata',        icon: '🌱', minPoints: 0,    color: '#94a3b8' },
  { level: 2, titleM: 'Aprendiz',     titleF: 'Aprendiz',      icon: '📚', minPoints: 250,  color: '#60a5fa' },
  { level: 3, titleM: 'Colaborador',  titleF: 'Colaboradora',  icon: '🤝', minPoints: 600,  color: '#34d399' },
  { level: 4, titleM: 'Dedicado',     titleF: 'Dedicada',      icon: '💪', minPoints: 1200, color: '#a78bfa' },
  { level: 5, titleM: 'Especialista', titleF: 'Especialista',  icon: '🔬', minPoints: 2500, color: '#fbbf24' },
  { level: 6, titleM: 'Elite',        titleF: 'Elite',         icon: '👑', minPoints: 5000, color: '#f97316' },
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

  // ── Cadastro ─────────────────────────────────────────────────────────────────
  full_name: {
    label: 'Nome Verdadeiro',
    emoji: '🪪',
    desc:  'Nome completo cadastrado sem abreviações',
    how:   'Em Meu Perfil, preencha o nome completo sem abreviar — "Emanuel M." não vale, escreva "Emanuel Maestre dos Santos"',
  },
  has_photo: {
    label: 'Identidade Completa',
    emoji: '📸',
    desc:  'Foto real de perfil adicionada',
    how:   'Em Meu Perfil, adicione uma foto sua real — fotos de desenho ou avatar não são válidas e a pontuação é concedida apenas na primeira vez',
  },

  // ── Presença ─────────────────────────────────────────────────────────────────
  first_day: {
    label: 'Primeiro Dia',
    emoji: '🌱',
    desc:  'Primeiro registro de ponto completo',
    how:   'Registre entrada e saída pela primeira vez — bem-vindo ao sistema!',
  },
  punctual_10: {
    label: 'Sempre Pontual',
    emoji: '⏰',
    desc:  '10 entradas registradas dentro do horário',
    how:   'Registre a entrada em até 15 min após o horário previsto por 10 dias diferentes',
  },
  reporter_5: {
    label: 'Repórter',
    emoji: '📝',
    desc:  '5 dias com atividade documentada na saída',
    how:   'Na tela de saída, descreva o que fez (mín. 10 caracteres) em 5 dias diferentes',
  },
  reporter_20: {
    label: 'Cronista',
    emoji: '📋',
    desc:  '20 dias com atividade documentada na saída',
    how:   'Na tela de saída, descreva o que fez (mín. 10 caracteres) em 20 dias diferentes',
  },

  // ── Streak ───────────────────────────────────────────────────────────────────
  streak_3: {
    label: 'Trio Imparável',
    emoji: '🔥',
    desc:  '3 dias consecutivos presentes',
    how:   'Compareça e registre ponto por 3 dias seguidos — ativa multiplicador ×1.2',
  },
  streak_7: {
    label: 'Semana Perfeita',
    emoji: '⚡',
    desc:  '7 dias consecutivos presentes',
    how:   'Compareça e registre ponto por 7 dias seguidos sem faltar — ativa multiplicador ×1.5',
  },
  streak_30: {
    label: 'Mês Inquebrável',
    emoji: '💎',
    desc:  '30 dias consecutivos presentes',
    how:   'Compareça e registre ponto por 30 dias seguidos sem faltar — dobra todos os pontos do dia (×2.0)',
  },

  // ── Carga horária — Marcos totais ────────────────────────────────────────────
  workload_25: {
    label: 'Quarto do Caminho',
    emoji: '⏳',
    desc:  '25% da carga horária total cumprida',
    how:   'Acumule horas até atingir 25% do total exigido pelo seu estágio — bônus único de +50 pts',
  },
  workload_50: {
    label: 'Meio Caminho',
    emoji: '⌛',
    desc:  '50% da carga horária total cumprida',
    how:   'Acumule horas até atingir a metade do total exigido pelo seu estágio — bônus único de +100 pts',
  },
  workload_75: {
    label: 'Reta Final',
    emoji: '🎯',
    desc:  '75% da carga horária total cumprida',
    how:   'Acumule horas até atingir 75% do total exigido pelo seu estágio — bônus único de +150 pts',
  },
  workload_100: {
    label: 'Missão Cumprida',
    emoji: '🏁',
    desc:  'Carga horária total do estágio concluída',
    how:   'Conclua 100% das horas exigidas pelo seu estágio — bônus único de +250 pts',
  },

  // ── Carga horária — Consistência mensal ──────────────────────────────────────
  month_80: {
    label: 'Mês Dedicado',
    emoji: '🚀',
    desc:  'Cumprida 80% das horas esperadas no mês',
    how:   'Registre horas suficientes para atingir 80% da meta mensal de carga horária — concedido por mês',
  },
  month_complete: {
    label: 'Mês Completo',
    emoji: '🏆',
    desc:  '100% das horas esperadas no mês cumpridas',
    how:   'Registre horas suficientes para bater 100% da meta mensal de carga horária — concedido por mês',
  },

  // ── Ranking ──────────────────────────────────────────────────────────────────
  top_month: {
    label: 'Destaque do Mês',
    emoji: '👑',
    desc:  '1º lugar no ranking mensal',
    how:   'Termine o mês com mais pontos que todos os outros estagiários — presença, pontualidade, atividades e carga horária contam',
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
