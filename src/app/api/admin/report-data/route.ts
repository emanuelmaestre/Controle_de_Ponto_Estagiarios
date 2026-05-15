import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'monthly'

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let startDate: string
  let endDate: string
  let label = ''

  if (type === 'monthly') {
    const now = new Date()
    const month = searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, mon] = month.split('-').map(Number)
    startDate = new Date(Date.UTC(year, mon - 1, 1)).toISOString()
    endDate   = new Date(Date.UTC(year, mon, 1)).toISOString()
    label = new Date(Date.UTC(year, mon - 1, 1)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } else if (type === 'daily') {
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    startDate = `${date}T00:00:00.000Z`
    endDate   = `${date}T23:59:59.999Z`
    label = new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } else if (type === 'weekly') {
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const d = new Date(date + 'T12:00:00Z')
    const day = d.getUTCDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setUTCDate(d.getUTCDate() + diffToMonday)
    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)
    startDate = monday.toISOString().slice(0, 10) + 'T00:00:00.000Z'
    endDate   = sunday.toISOString().slice(0, 10) + 'T23:59:59.999Z'
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
    label = `${fmt(monday)} a ${fmt(sunday)}`
  } else {
    // custom
    const start = searchParams.get('start') || new Date().toISOString().slice(0, 10)
    const end   = searchParams.get('end')   || new Date().toISOString().slice(0, 10)
    startDate = `${start}T00:00:00.000Z`
    endDate   = `${end}T23:59:59.999Z`
    const fmt = (s: string) => new Date(s + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    label = `${fmt(start)} a ${fmt(end)}`
  }

  // Estagiários ativos
  const { data: interns } = await supabase
    .from('profiles')
    .select('id, full_name, email, course, nickname')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')

  // Registros do período
  const { data: records } = await supabase
    .from('time_records')
    .select('intern_id, duration_minutes, status')
    .gte('clock_in', startDate)
    .lte('clock_in', endDate)

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
