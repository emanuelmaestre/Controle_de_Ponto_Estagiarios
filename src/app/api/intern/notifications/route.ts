import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { isFullNameComplete, ACHIEVEMENTS } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

// Notificações pertinentes ao próprio estagiário.
// Tudo o que é responsabilidade do gestor (curso, carga, horário, aprovações,
// inatividade de terceiros) NÃO entra aqui — fica apenas no sino do admin.
export type InternNotificationType = 'action' | 'alert' | 'feedback' | 'achievement'

export interface InternNotification {
  id: string
  type: InternNotificationType
  title: string
  description: string
  href: string
  /** true = pendência que segue pingando o badge até ser resolvida (cadastro/ponto) */
  persistent: boolean
  /** ISO — usado para ordenar e para o "novo desde a última visita" */
  createdAt: string
  priority: number // 1 = mais alta
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = createSupabaseServiceClient()

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, photo_url, role, total_hours_required')
    .eq('id', user.id)
    .maybeSingle()

  // Admin não recebe notificações de estagiário — usa o sino do painel.
  if (!profile || profile.role !== 'intern') {
    return NextResponse.json({ notifications: [], total: 0 })
  }

  const notifications: InternNotification[] = []
  const nowIso = new Date().toISOString()

  // ── 1. Cadastro: nome incompleto / abreviado ───────────────────────────
  if (!profile.full_name || !isFullNameComplete(profile.full_name)) {
    notifications.push({
      id: 'profile_name',
      type: 'action',
      title: 'Complete seu nome',
      description: 'Seu nome está incompleto ou abreviado. Cadastre o nome completo, sem abreviações, no seu perfil.',
      href: '/profile?tab=dados',
      persistent: true,
      createdAt: nowIso,
      priority: 2,
    })
  }

  // ── 2. Cadastro: sem foto de perfil ────────────────────────────────────
  if (!profile.photo_url) {
    notifications.push({
      id: 'profile_photo',
      type: 'action',
      title: 'Adicione uma foto de perfil',
      description: 'Você ainda não tem uma foto real de perfil. Adicione a sua em Meu Perfil e ganhe pontos.',
      href: '/profile?tab=dados',
      persistent: true,
      createdAt: nowIso,
      priority: 3,
    })
  }

  // ── 3. Ponto em aberto esquecido ───────────────────────────────────────
  const { data: openRecord } = await db
    .from('time_records')
    .select('id, clock_in')
    .eq('intern_id', user.id)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (openRecord) {
    const today = nowIso.slice(0, 10)
    const clockInDay = openRecord.clock_in.slice(0, 10)
    const hoursOpen = (Date.now() - new Date(openRecord.clock_in).getTime()) / 3_600_000
    if (clockInDay < today || hoursOpen > 10) {
      const dayLabel = new Date(clockInDay + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: '2-digit',
      })
      notifications.push({
        id: `open_${openRecord.id}`,
        type: 'alert',
        title: 'Ponto em aberto',
        description: clockInDay < today
          ? `Você esqueceu de registrar a saída de ${dayLabel}. Registre agora para não perder a sessão.`
          : `Seu ponto está aberto há mais de ${Math.floor(hoursOpen)} horas. Não esqueça de registrar a saída!`,
        href: '/dashboard',
        persistent: true,
        createdAt: openRecord.clock_in,
        priority: 1,
      })
    }
  }

  // ── 4. Feedback respondido / implementado pelo admin ───────────────────
  const { data: feedbacks } = await db
    .from('feedback')
    .select('id, message, status, admin_reply, created_at')
    .eq('intern_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  for (const f of feedbacks ?? []) {
    const replied = !!f.admin_reply && f.admin_reply.trim().length > 0
    const implemented = f.status === 'implemented'
    if (!replied && !implemented) continue
    const snippet = f.message.length > 60 ? f.message.slice(0, 57) + '…' : f.message
    notifications.push({
      id: `fb_${f.id}_${f.status}${replied ? '_r' : ''}`,
      type: 'feedback',
      title: implemented ? 'Seu feedback foi implementado 🎉' : 'O gestor respondeu seu feedback',
      description: implemented
        ? `"${snippet}" — agora faz parte do sistema. Você ganhou pontos por isso!`
        : `"${snippet}" — toque para ver a resposta do gestor.`,
      href: '/profile?tab=novidades',
      persistent: false,
      createdAt: f.created_at,
      priority: 3,
    })
  }

  // ── 5. Conquistas desbloqueadas recentemente (últimos 21 dias) ─────────
  const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  const { data: achievements } = await db
    .from('achievements')
    .select('type, unlocked_at')
    .eq('intern_id', user.id)
    .gte('unlocked_at', cutoff)
    .order('unlocked_at', { ascending: false })

  for (const a of achievements ?? []) {
    const meta = ACHIEVEMENTS[a.type]
    notifications.push({
      id: `ach_${a.type}`,
      type: 'achievement',
      title: meta ? `Conquista: ${meta.label} ${meta.emoji}` : 'Nova conquista desbloqueada 🏅',
      description: meta?.desc ?? 'Você desbloqueou uma nova conquista. Veja na aba Conquistas.',
      href: '/profile?tab=conquistas',
      persistent: false,
      createdAt: a.unlocked_at,
      priority: 4,
    })
  }

  // ── 6. Marco de carga horária (≥90% e 100% do total do estágio) ────────
  const required = (profile.total_hours_required ?? 0) * 60
  if (required > 0) {
    const { data: approved } = await db
      .from('time_records')
      .select('duration_minutes')
      .eq('intern_id', user.id)
      .eq('status', 'approved')

    const worked = (approved ?? []).reduce((sum, r) => sum + (r.duration_minutes ?? 0), 0)
    const pct = worked / required

    if (pct >= 1.0) {
      notifications.push({
        id: 'workload_100',
        type: 'achievement',
        title: 'Carga horária concluída 🏁',
        description: 'Você completou 100% das horas exigidas pelo seu estágio. Parabéns pela dedicação!',
        href: '/profile?tab=conquistas',
        persistent: false,
        createdAt: nowIso,
        priority: 2,
      })
    } else if (pct >= 0.9) {
      const remainingH = Math.max(1, Math.round((required - worked) / 60))
      notifications.push({
        id: 'workload_90',
        type: 'achievement',
        title: 'Reta final do estágio 🎯',
        description: `Você já cumpriu ${Math.round(pct * 100)}% da carga horária. Faltam aprox. ${remainingH}h para concluir.`,
        href: '/profile?tab=conquistas',
        persistent: false,
        createdAt: nowIso,
        priority: 2,
      })
    }
  }

  notifications.sort((a, b) =>
    a.priority - b.priority || b.createdAt.localeCompare(a.createdAt))

  return NextResponse.json({ notifications, total: notifications.length })
}
