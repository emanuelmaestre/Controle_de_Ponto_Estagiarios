import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'

const SP = 3 * 60 * 60 * 1000
type ReportRecord = Record<string, any>

function list(value: unknown): ReportRecord[] {
  return Array.isArray(value) ? value : []
}

function periodFromMonth(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const startDate = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP).toISOString()
  const endDate   = new Date(Date.UTC(year, mon,     1, 0, 0, 0) + SP).toISOString()
  const label = new Date(Date.UTC(year, mon - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return { startDate, endDate, label }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export async function GET(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: authProfile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (authProfile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const report   = searchParams.get('report') ?? 'summary'
  const month    = searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
  const internId = searchParams.get('internId') ?? ''

  const supabase = createSupabaseServiceClient()
  const db = supabase as any  // bypass stale type definitions for custom columns
  const { startDate, endDate, label } = periodFromMonth(month)

  // â”€â”€ attendance: frequÃªncia individual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'attendance') {
    const { data: intern } = await db.from('profiles').select('full_name').eq('id', internId).single()
    const { data: _rec1 } = await db
      .from('time_records')
      .select('clock_in, clock_out, duration_minutes, status, is_late, activities')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })
    const records = _rec1 as any[] | null

    return NextResponse.json({
      internName: (intern as any)?.full_name,
      columns: [
        { header: 'Entrada',    dataKey: 'entrada' },
        { header: 'SaÃ­da',      dataKey: 'saida' },
        { header: 'DuraÃ§Ã£o',    dataKey: 'duracao' },
        { header: 'Status',     dataKey: 'status' },
        { header: 'Pontual',    dataKey: 'pontual' },
        { header: 'Atividades', dataKey: 'atividades' },
      ],
      rows: list(records).map(r => ({
        entrada:    fmtDate(r.clock_in),
        saida:      r.clock_out ? fmtDate(r.clock_out) : 'â€”',
        duracao:    r.duration_minutes ? minutesToHours(r.duration_minutes) : 'â€”',
        status:     r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
        pontual:    r.is_late ? 'NÃ£o' : 'Sim',
        atividades: Array.isArray(r.activities) ? r.activities.join('; ') : 'â€”',
      })),
    })
  }

  // â”€â”€ hours: horas trabalhadas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'hours') {
    const { data: intern } = await db.from('profiles').select('full_name').eq('id', internId).single()
    const { data: records } = await db
      .from('time_records')
      .select('clock_in, duration_minutes, status')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })

    const approved = list(records).filter(r => r.status === 'approved')
    const totalMin = approved.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)

    return NextResponse.json({
      internName: intern?.full_name,
      columns: [
        { header: 'Data',         dataKey: 'data' },
        { header: 'Horas (dia)',  dataKey: 'horas' },
        { header: 'Status',       dataKey: 'status' },
      ],
      rows: [
        ...list(records).map(r => ({
          data:   new Date(r.clock_in).toLocaleDateString('pt-BR'),
          horas:  r.duration_minutes ? minutesToHours(r.duration_minutes) : 'â€”',
          status: r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
        })),
        { data: 'TOTAL APROVADO', horas: minutesToHours(totalMin), status: `${approved.length} sessÃµes` },
      ],
    })
  }

  // â”€â”€ punctuality: pontualidade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'punctuality') {
    const { data: intern } = await db.from('profiles').select('full_name').eq('id', internId).single()
    const { data: records } = await db
      .from('time_records')
      .select('clock_in, is_late, status')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })

    const approved = list(records).filter(r => r.status === 'approved')
    const late = approved.filter(r => r.is_late).length
    const onTime = approved.length - late
    const rate = approved.length > 0 ? Math.round((onTime / approved.length) * 100) : 100

    return NextResponse.json({
      internName: intern?.full_name,
      columns: [
        { header: 'Data',     dataKey: 'data' },
        { header: 'Pontual',  dataKey: 'pontual' },
        { header: 'Status',   dataKey: 'status' },
      ],
      rows: [
        ...list(records).map(r => ({
          data:    new Date(r.clock_in).toLocaleDateString('pt-BR'),
          pontual: r.is_late ? 'NÃ£o' : 'Sim',
          status:  r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
        })),
        { data: `RESUMO: ${onTime} pontual, ${late} atraso`, pontual: `${rate}%`, status: `${approved.length} sessÃµes` },
      ],
    })
  }

  // â”€â”€ activities: atividades â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'activities') {
    const { data: intern } = await db.from('profiles').select('full_name').eq('id', internId).single()
    const { data: records } = await db
      .from('time_records')
      .select('clock_in, activities')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: false })

    const rows: Record<string, string>[] = []
    for (const r of list(records)) {
      const acts = Array.isArray(r.activities) ? r.activities : []
      for (const act of acts) {
        rows.push({ data: new Date(r.clock_in).toLocaleDateString('pt-BR'), atividade: act })
      }
    }

    return NextResponse.json({
      internName: intern?.full_name,
      columns: [
        { header: 'Data',       dataKey: 'data' },
        { header: 'Atividade',  dataKey: 'atividade', width: 120 },
      ],
      rows,
    })
  }

  // â”€â”€ sheet: ficha completa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'sheet') {
    const { data: intern } = await db
      .from('profiles')
      .select('full_name, email, course, nickname, points, level, streak_days, created_at, workload_hours')
      .eq('id', internId).single()

    const { data: allRec } = await db
      .from('time_records').select('duration_minutes, status, is_late').eq('intern_id', internId)

    const approved = list(allRec).filter(r => r.status === 'approved')
    const totalMin = approved.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const late = approved.filter(r => r.is_late).length
    const rate = approved.length > 0 ? Math.round(((approved.length - late) / approved.length) * 100) : 100

    return NextResponse.json({
      internName: intern?.full_name,
      columns: [
        { header: 'Campo', dataKey: 'campo', width: 50 },
        { header: 'Valor', dataKey: 'valor', width: 120 },
      ],
      rows: [
        { campo: 'Nome completo',     valor: intern?.full_name ?? 'â€”' },
        { campo: 'E-mail',            valor: intern?.email ?? 'â€”' },
        { campo: 'Curso',             valor: intern?.course ?? 'â€”' },
        { campo: 'Apelido',           valor: intern?.nickname ?? 'â€”' },
        { campo: 'InÃ­cio do estÃ¡gio', valor: intern?.created_at ? new Date(intern.created_at).toLocaleDateString('pt-BR') : 'â€”' },
        { campo: 'Carga prevista',    valor: intern?.workload_hours ? `${intern.workload_hours}h` : 'â€”' },
        { campo: 'Horas cumpridas',   valor: minutesToHours(totalMin) },
        { campo: 'SessÃµes aprovadas', valor: String(approved.length) },
        { campo: 'Pontualidade',      valor: `${rate}%` },
        { campo: 'Pontos gamificaÃ§Ã£o',valor: String(intern?.points ?? 0) },
        { campo: 'NÃ­vel',             valor: String(intern?.level ?? 1) },
        { campo: 'SequÃªncia atual',   valor: `${intern?.streak_days ?? 0} dias` },
      ],
    })
  }

  // â”€â”€ workload: carga horÃ¡ria â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'workload') {
    const { data: intern } = await db
      .from('profiles').select('full_name, workload_hours').eq('id', internId).single()

    const { data: allRec } = await db
      .from('time_records').select('duration_minutes, status').eq('intern_id', internId).eq('status', 'approved')

    const totalMin = list(allRec).reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const wlMin = (intern?.workload_hours ?? 0) * 60
    const remainMin = Math.max(0, wlMin - totalMin)
    const pct = wlMin > 0 ? Math.min(100, Math.round((totalMin / wlMin) * 100)) : 0

    return NextResponse.json({
      internName: intern?.full_name,
      columns: [
        { header: 'MÃ©trica',  dataKey: 'metrica' },
        { header: 'Valor',    dataKey: 'valor' },
      ],
      rows: [
        { metrica: 'Carga horÃ¡ria total',    valor: `${intern?.workload_hours ?? 0}h` },
        { metrica: 'Horas cumpridas',        valor: minutesToHours(totalMin) },
        { metrica: 'Horas restantes',        valor: minutesToHours(remainMin) },
        { metrica: 'Percentual concluÃ­do',   valor: `${pct}%` },
        { metrica: 'SessÃµes aprovadas',      valor: String(allRec?.length ?? 0) },
      ],
    })
  }

  // â”€â”€ summary: resumo mensal geral â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'summary') {
    const { data: interns } = await db.from('profiles').select('id, full_name, course, email').eq('role', 'intern').eq('is_active', true).order('full_name')
    const { data: records } = await db.from('time_records').select('intern_id, duration_minutes, status, is_late').gte('clock_in', startDate).lt('clock_in', endDate)

    const map = new Map<string, { name: string; course: string; min: number; sessions: number; approved: number; late: number }>(
      list(interns).map(i => [i.id, { name: i.full_name, course: i.course ?? '', min: 0, sessions: 0, approved: 0, late: 0 }])
    )
    for (const r of list(records)) {
      const e = map.get(r.intern_id)
      if (e) {
        e.sessions++
        if (r.status === 'approved') { e.approved++; e.min += r.duration_minutes ?? 0 }
        if (r.is_late) e.late++
      }
    }

    return NextResponse.json({
      columns: [
        { header: 'EstagiÃ¡rio', dataKey: 'nome', width: 50 },
        { header: 'Curso',      dataKey: 'curso' },
        { header: 'Horas',      dataKey: 'horas' },
        { header: 'SessÃµes',    dataKey: 'sessoes' },
        { header: 'Aprovadas',  dataKey: 'aprovadas' },
        { header: 'Atrasos',    dataKey: 'atrasos' },
      ],
      rows: Array.from(map.values()).map(e => ({
        nome:      e.name,
        curso:     e.course || 'â€”',
        horas:     minutesToHours(e.min),
        sessoes:   String(e.sessions),
        aprovadas: String(e.approved),
        atrasos:   String(e.late),
      })),
    })
  }

  // â”€â”€ by_course: horas por curso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'by_course') {
    const { data: interns } = await db.from('profiles').select('id, course').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db.from('time_records').select('intern_id, duration_minutes, status').gte('clock_in', startDate).lt('clock_in', endDate).eq('status', 'approved')

    const courseMap = new Map<string, { min: number; count: number }>()
    const internCourse = new Map(list(interns).map(i => [i.id, i.course ?? 'NÃ£o informado']))
    for (const r of list(records)) {
      const course = internCourse.get(r.intern_id) ?? 'NÃ£o informado'
      const e = courseMap.get(course) ?? { min: 0, count: 0 }
      e.min += r.duration_minutes ?? 0
      e.count++
      courseMap.set(course, e)
    }

    return NextResponse.json({
      columns: [
        { header: 'Curso',   dataKey: 'curso', width: 80 },
        { header: 'Horas',   dataKey: 'horas' },
        { header: 'SessÃµes', dataKey: 'sessoes' },
      ],
      rows: Array.from(courseMap.entries()).map(([curso, e]) => ({
        curso, horas: minutesToHours(e.min), sessoes: String(e.count),
      })).sort((a, b) => b.horas.localeCompare(a.horas)),
    })
  }

  // â”€â”€ ending_soon: prÃ³ximos do encerramento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'ending_soon') {
    const { data: interns } = await db.from('profiles').select('id, full_name, course, workload_hours').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db.from('time_records').select('intern_id, duration_minutes').eq('status', 'approved')

    const minMap = new Map<string, number>()
    for (const r of list(records)) {
      minMap.set(r.intern_id, (minMap.get(r.intern_id) ?? 0) + (r.duration_minutes ?? 0))
    }

    return NextResponse.json({
      columns: [
        { header: 'EstagiÃ¡rio',   dataKey: 'nome', width: 50 },
        { header: 'Curso',        dataKey: 'curso' },
        { header: 'Cumprido',     dataKey: 'cumprido' },
        { header: 'Restante',     dataKey: 'restante' },
        { header: 'Carga total',  dataKey: 'total' },
        { header: 'ConclusÃ£o',    dataKey: 'pct' },
      ],
      rows: list(interns)
        .map(i => {
          const worked = minMap.get(i.id) ?? 0
          const total = (i.workload_hours ?? 0) * 60
          const remaining = Math.max(0, total - worked)
          const pct = total > 0 ? Math.round((worked / total) * 100) : 0
          return { nome: i.full_name, curso: i.course ?? 'â€”', cumprido: minutesToHours(worked), restante: minutesToHours(remaining), total: `${i.workload_hours ?? 0}h`, pct: `${pct}%`, _pct: pct }
        })
        .filter(r => r._pct >= 70)
        .sort((a, b) => b._pct - a._pct)
        .map(({ _pct: _, ...rest }) => rest),
    })
  }

  // â”€â”€ ranking_full: ranking completo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'ranking_full') {
    const { data: interns } = await db
      .from('profiles').select('full_name, course, points, level').eq('role', 'intern').eq('is_active', true).order('points', { ascending: false })

    return NextResponse.json({
      columns: [
        { header: '#',      dataKey: 'pos', width: 12 },
        { header: 'Nome',   dataKey: 'nome', width: 60 },
        { header: 'Curso',  dataKey: 'curso' },
        { header: 'NÃ­vel',  dataKey: 'nivel' },
        { header: 'Pontos', dataKey: 'pontos' },
      ],
      rows: list(interns).map((i, idx) => ({
        pos: String(idx + 1), nome: i.full_name, curso: i.course ?? 'â€”', nivel: String(i.level ?? 1), pontos: String(i.points ?? 0),
      })),
    })
  }

  // â”€â”€ ranking_punctuality: ranking pontualidade â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'ranking_punctuality') {
    const { data: interns } = await db.from('profiles').select('id, full_name').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db.from('time_records').select('intern_id, is_late, status').gte('clock_in', startDate).lt('clock_in', endDate).eq('status', 'approved')

    const map = new Map<string, { name: string; total: number; onTime: number }>()
    for (const i of list(interns)) map.set(i.id, { name: i.full_name, total: 0, onTime: 0 })
    for (const r of list(records)) {
      const e = map.get(r.intern_id)
      if (e) { e.total++; if (!r.is_late) e.onTime++ }
    }

    return NextResponse.json({
      columns: [
        { header: '#',         dataKey: 'pos', width: 12 },
        { header: 'Nome',      dataKey: 'nome', width: 60 },
        { header: 'Pontual',   dataKey: 'ontime' },
        { header: 'Atrasos',   dataKey: 'late' },
        { header: 'Taxa',      dataKey: 'taxa' },
      ],
      rows: Array.from(map.values())
        .filter(e => e.total > 0)
        .sort((a, b) => (b.onTime / b.total) - (a.onTime / a.total))
        .map((e, idx) => ({
          pos: String(idx + 1), nome: e.name,
          ontime: String(e.onTime), late: String(e.total - e.onTime),
          taxa: `${Math.round((e.onTime / e.total) * 100)}%`,
        })),
    })
  }

  // â”€â”€ ranking_activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'ranking_activities') {
    const { data: interns } = await db.from('profiles').select('id, full_name').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db.from('time_records').select('intern_id, activities').gte('clock_in', startDate).lt('clock_in', endDate)

    const map = new Map<string, { name: string; count: number }>()
    for (const i of list(interns)) map.set(i.id, { name: i.full_name, count: 0 })
    for (const r of list(records)) {
      const e = map.get(r.intern_id)
      if (e && Array.isArray(r.activities)) e.count += r.activities.length
    }

    return NextResponse.json({
      columns: [
        { header: '#',          dataKey: 'pos', width: 12 },
        { header: 'Nome',       dataKey: 'nome', width: 60 },
        { header: 'Atividades', dataKey: 'count' },
      ],
      rows: Array.from(map.values()).sort((a, b) => b.count - a.count).map((e, idx) => ({
        pos: String(idx + 1), nome: e.name, count: String(e.count),
      })),
    })
  }

  // â”€â”€ hall_of_fame â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (report === 'hall_of_fame') {
    const { data: interns } = await db
      .from('profiles').select('full_name, points, level, streak_days').eq('role', 'intern').order('points', { ascending: false }).limit(20)

    const { data: achCount } = await db
      .from('achievements').select('intern_id')

    const achMap = new Map<string, number>()
    for (const a of list(achCount)) achMap.set(a.intern_id, (achMap.get(a.intern_id) ?? 0) + 1)

    return NextResponse.json({
      columns: [
        { header: '#',          dataKey: 'pos', width: 12 },
        { header: 'Nome',       dataKey: 'nome', width: 60 },
        { header: 'Pontos',     dataKey: 'pontos' },
        { header: 'NÃ­vel',      dataKey: 'nivel' },
        { header: 'SequÃªncia',  dataKey: 'streak' },
        { header: 'Conquistas', dataKey: 'ach' },
      ],
      rows: list(interns).map((i, idx) => ({
        pos: String(idx + 1), nome: i.full_name, pontos: String(i.points ?? 0),
        nivel: String(i.level ?? 1), streak: `${i.streak_days ?? 0} dias`, ach: 'â€”',
      })),
    })
  }

  return NextResponse.json({ columns: [], rows: [] })
}
