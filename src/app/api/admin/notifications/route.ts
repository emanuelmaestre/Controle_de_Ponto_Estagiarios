import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { isFullNameComplete } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

export type NotificationType = 'admin' | 'intern' | 'critical' | 'info'

export interface AdminNotification {
  id: string
  internId: string
  internName: string
  internInitials: string
  type: NotificationType
  title: string
  description: string
  href: string
  priority: number  // 1 = highest
}

export async function GET() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: authProfile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (authProfile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const db = createSupabaseServiceClient()
  const notifications: AdminNotification[] = []

  const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  // ── 1. Buscar todos os estagiários ativos ───────────────────────────────
  const { data: interns } = await db
    .from('profiles')
    .select('id, full_name, course, photo_url, total_hours_required, points, streak_days')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')

  if (!interns?.length) return NextResponse.json({ notifications: [], total: 0 })

  const internIds = interns.map(i => i.id)

  // ── 2. Buscar schedules de todos os estagiários ─────────────────────────
  const { data: schedules } = await db
    .from('intern_schedules')
    .select('intern_id, day_of_week, is_active')
    .in('intern_id', internIds)
    .eq('is_active', true)

  const scheduledInterns = new Set((schedules ?? []).map(s => s.intern_id))

  // ── 3. Registros pendentes de aprovação ────────────────────────────────
  const { data: pendingRecords } = await db
    .from('time_records')
    .select('intern_id')
    .in('intern_id', internIds)
    .eq('status', 'pending')

  const pendingByIntern = new Map()
  for (const r of pendingRecords ?? []) {
    pendingByIntern.set(r.intern_id, (pendingByIntern.get(r.intern_id) ?? 0) + 1)
  }

  // ── 4. Registros recentes (últimos 14 dias) ────────────────────────────
  const cutoff14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentRecords } = await db
    .from('time_records')
    .select('intern_id')
    .in('intern_id', internIds)
    .gte('clock_in', cutoff14)

  const recentInterns = new Set((recentRecords ?? []).map(r => r.intern_id))

  // ── 5. Horas totais cumpridas por estagiário ───────────────────────────
  const { data: approvedRecords } = await db
    .from('time_records')
    .select('intern_id, duration_minutes')
    .in('intern_id', internIds)
    .eq('status', 'approved')

  const hoursWorkedMap = new Map()
  for (const r of approvedRecords ?? []) {
    hoursWorkedMap.set(r.intern_id, (hoursWorkedMap.get(r.intern_id) ?? 0) + (r.duration_minutes ?? 0))
  }

  // ── 6. Verificar cada estagiário ───────────────────────────────────────
  for (const intern of interns) {
    const id   = intern.id
    const name = intern.full_name ?? 'Sem nome'
    const inits = initials(name)
    const base = `/admin/interns/${id}`

    // 6a. Nome incompleto / abreviado (ação do aluno)
    if (!intern.full_name || !isFullNameComplete(intern.full_name)) {
      notifications.push({
        id: `${id}_name`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'intern',
        title: 'Nome incompleto ou abreviado',
        description: `"${intern.full_name || 'Não informado'}" — nome precisa ser completo sem abreviações`,
        href: `${base}?tab=cadastro`,
        priority: 2,
      })
    }

    // 6b. Sem foto (ação do aluno)
    if (!intern.photo_url) {
      notifications.push({
        id: `${id}_photo`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'intern',
        title: 'Foto de perfil não cadastrada',
        description: 'Aluno ainda não adicionou uma foto real de perfil',
        href: `${base}?tab=cadastro`,
        priority: 3,
      })
    }

    // 6c. Sem curso (ação do admin)
    if (!intern.course) {
      notifications.push({
        id: `${id}_course`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'admin',
        title: 'Curso não informado',
        description: 'O curso do estagiário não foi preenchido no cadastro',
        href: `${base}?tab=cadastro`,
        priority: 2,
      })
    }

    // 6d. Sem carga horária (CRÍTICO — impede cálculo de horas)
    if (!intern.total_hours_required || intern.total_hours_required <= 0) {
      notifications.push({
        id: `${id}_workload`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'critical',
        title: 'Carga horária total não definida',
        description: 'Sem a carga horária, o sistema não consegue calcular horas restantes',
        href: `${base}?tab=cadastro`,
        priority: 1,
      })
    }

    // 6e. Sem horários configurados (CRÍTICO — impede controle de pontualidade)
    if (!scheduledInterns.has(id)) {
      notifications.push({
        id: `${id}_schedule`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'critical',
        title: 'Horários da semana não configurados',
        description: 'Sem horário definido, o sistema não detecta atrasos nem presença corretamente',
        href: `${base}?tab=horario`,
        priority: 1,
      })
    }

    // 6f. Registros pendentes de aprovação (ação do admin)
    const pendingCount = pendingByIntern.get(id) ?? 0
    if (pendingCount > 0) {
      notifications.push({
        id: `${id}_pending`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'admin',
        title: `${pendingCount} registro${pendingCount > 1 ? 's' : ''} aguardando aprovação`,
        description: `Ponto${pendingCount > 1 ? 's' : ''} registrado${pendingCount > 1 ? 's' : ''} pelo aluno ${pendingCount > 1 ? 'estão' : 'está'} pendente${pendingCount > 1 ? 's' : ''} de revisão`,
        href: `${base}?tab=visao-geral`,
        priority: 2,
      })
    }

    // 6g. Inativo há mais de 14 dias (informativo)
    const hasWorkload = intern.total_hours_required && intern.total_hours_required > 0
    const minutesWorked = hoursWorkedMap.get(id) ?? 0
    const workloadMinutes = (intern.total_hours_required ?? 0) * 60
    const pctDone = workloadMinutes > 0 ? minutesWorked / workloadMinutes : 0

    if (!recentInterns.has(id) && pctDone < 0.95 && hasWorkload) {
      notifications.push({
        id: `${id}_inactive`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'info',
        title: 'Sem registros há mais de 14 dias',
        description: 'O aluno não registrou ponto nas últimas duas semanas',
        href: `${base}?tab=visao-geral`,
        priority: 4,
      })
    }

    // 6h. Carga horária quase completa (≥ 90%)
    if (hasWorkload && pctDone >= 0.9 && pctDone < 1.0) {
      notifications.push({
        id: `${id}_ending`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'info',
        title: `Carga horária ${Math.round(pctDone * 100)}% concluída`,
        description: `Faltam aprox. ${Math.round((workloadMinutes - minutesWorked) / 60)}h para encerrar o estágio`,
        href: `${base}?tab=visao-geral`,
        priority: 4,
      })
    }

    // 6i. Carga horária excedida (aviso)
    if (hasWorkload && pctDone > 1.0) {
      notifications.push({
        id: `${id}_exceeded`,
        internId: id,
        internName: name,
        internInitials: inits,
        type: 'admin',
        title: 'Carga horária excedida',
        description: `O aluno ultrapassou a carga horária total prevista do estágio`,
        href: `${base}?tab=visao-geral`,
        priority: 2,
      })
    }
  }

  // Ordenar por prioridade depois por nome
  notifications.sort((a, b) => a.priority - b.priority || a.internName.localeCompare(b.internName))

  return NextResponse.json({ notifications, total: notifications.length })
}
