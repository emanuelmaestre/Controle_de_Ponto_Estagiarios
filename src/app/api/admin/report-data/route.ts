import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'monthly'

  // Verificar autenticação com cliente normal
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Usar service client para bypassar RLS e ver todos os registros
  const supabase = createSupabaseServiceClient()

  // Fuso horário de São Paulo: UTC-3
  // Converter datas locais para UTC corretamente
  const SP_OFFSET = 3 * 60 * 60 * 1000 // 3 horas em ms

  let startDate: string
  let endDate: string
  let label = ''

  if (type === 'monthly') {
    const now = new Date()
    const month = searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, mon] = month.split('-').map(Number)
    // Início e fim do mês em São Paulo (adiciona 3h para converter SP→UTC)
    startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate   = new Date(Date.UTC(year, mon,     1, 0, 0, 0) + SP_OFFSET).toISOString()
    label = new Date(Date.UTC(year, mon - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } else if (type === 'daily') {
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const [y, m, d] = date.split('-').map(Number)
    startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59) + SP_OFFSET).toISOString()
    label = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
  } else if (type === 'weekly') {
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const d = new Date(date + 'T12:00:00Z')
    const day = d.getUTCDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() + diffToMonday)
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    const [my, mm, md] = monday.toISOString().slice(0, 10).split('-').map(Number)
    const [sy, sm, sd] = sunday.toISOString().slice(0, 10).split('-').map(Number)
    startDate = new Date(Date.UTC(my, mm - 1, md, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate   = new Date(Date.UTC(sy, sm - 1, sd, 23, 59, 59) + SP_OFFSET).toISOString()
    const fmt = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
    label = `${fmt(my, mm, md)} a ${fmt(sy, sm, sd)}`
  } else {
    // custom
    const start = searchParams.get('start') || new Date().toISOString().slice(0, 10)
    const end   = searchParams.get('end')   || new Date().toISOString().slice(0, 10)
    const [sy, sm, sd] = start.split('-').map(Number)
    const [ey, em, ed] = end.split('-').map(Number)
    startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate   = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59) + SP_OFFSET).toISOString()
    const fmt = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    label = `${fmt(sy, sm, sd)} a ${fmt(ey, em, ed)}`
  }

  // Estagiários ativos
  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, email, course, nickname')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')

  // Registros do período (sem RLS — vê todos os estagiários)
  const { data: records } = await supabase
    .from('time_records')
    .select('intern_id, duration_minutes, status')
    .gte('clock_in', startDate)
    .lt('clock_in', endDate)

  // Agregar por estagiário
  const internMap = new Map<string, {
    id: string; full_name: string; email: string; course: string | null; nickname: string | null
    total_minutes: number; total_sessions: number
    approved_sessions: number; pending_sessions: number; rejected_sessions: number
  }>()

  interns?.forEach(intern => {
    internMap.set(intern.id, {
      ...intern,
      total_minutes: 0,
      total_sessions: 0,
      approved_sessions: 0,
      pending_sessions: 0,
      rejected_sessions: 0,
    })
  })

  records?.forEach(record => {
    const intern = internMap.get(record.intern_id)
    if (intern) {
      intern.total_sessions++
      intern.total_minutes += record.duration_minutes || 0
      if (record.status === 'approved') intern.approved_sessions++
      else if (record.status === 'pending') intern.pending_sessions++
      else if (record.status === 'rejected') intern.rejected_sessions++
    }
  })

  return NextResponse.json({
    interns: Array.from(internMap.values()),
    startDate,
    endDate,
    label,
    type,
  })
}
