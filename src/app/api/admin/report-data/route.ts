import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/route-auth'

const SP_OFFSET = 3 * 60 * 60 * 1000

function getDateRange(searchParams: URLSearchParams) {
  const type = searchParams.get('type') || 'monthly'
  let startDate: string
  let endDate: string
  let label = ''

  if (type === 'monthly') {
    const now = new Date()
    const month = searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, mon] = month.split('-').map(Number)
    startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate = new Date(Date.UTC(year, mon, 1, 0, 0, 0) + SP_OFFSET).toISOString()
    label = new Date(Date.UTC(year, mon - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } else if (type === 'daily') {
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const [y, m, d] = date.split('-').map(Number)
    startDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate = new Date(Date.UTC(y, m - 1, d, 23, 59, 59) + SP_OFFSET).toISOString()
    label = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    })
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
    endDate = new Date(Date.UTC(sy, sm - 1, sd, 23, 59, 59) + SP_OFFSET).toISOString()
    const fmt = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
    label = `${fmt(my, mm, md)} a ${fmt(sy, sm, sd)}`
  } else {
    const start = searchParams.get('start') || new Date().toISOString().slice(0, 10)
    const end = searchParams.get('end') || new Date().toISOString().slice(0, 10)
    const [sy, sm, sd] = start.split('-').map(Number)
    const [ey, em, ed] = end.split('-').map(Number)
    startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0) + SP_OFFSET).toISOString()
    endDate = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59) + SP_OFFSET).toISOString()
    const fmt = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    label = `${fmt(sy, sm, sd)} a ${fmt(ey, em, ed)}`
  }

  return { type, startDate, endDate, label }
}

export async function GET(request: Request) {
  const auth = await requireManager()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const { type, startDate, endDate, label } = getDateRange(searchParams)
  const supabase = createSupabaseServiceClient() as any

  const { data: interns, error } = await supabase.rpc('get_report_summary', {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    interns: interns ?? [],
    startDate,
    endDate,
    label,
    type,
  })
}
