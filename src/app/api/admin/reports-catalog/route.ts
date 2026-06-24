import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'

const SP = 3 * 60 * 60 * 1000

type Rec = {
  id?: string
  intern_id?: string
  full_name?: string | null
  email?: string | null
  course?: string | null
  nickname?: string | null
  created_at?: string | null
  internship_start?: string | null
  total_hours_required?: number | null
  points?: number | null
  level?: number | null
  streak_days?: number | null
  clock_in?: string
  clock_out?: string | null
  duration_minutes?: number | null
  status?: string | null
  is_late?: boolean | null
  activities?: string[] | null
}

function list(v: unknown): Rec[]                        { return Array.isArray(v) ? v : [] }
function withId(v: unknown): (Rec & { id: string })[]  { return list(v).filter((r): r is Rec & { id: string } => typeof r.id === 'string') }

function periodFromMonth(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const startDate   = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0) + SP).toISOString()
  const endDate     = new Date(Date.UTC(year, mon,     1, 0, 0, 0) + SP).toISOString()
  const raw         = new Date(Date.UTC(year, mon - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const label       = raw.charAt(0).toUpperCase() + raw.slice(1)
  return { startDate, endDate, label, year, mon }
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function dayName(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' })
    .replace('.', '').replace(/^\w/, c => c.toUpperCase())
}

function mh(min: number): string {
  return minutesToHours(min)
}

// Calcula horas esperadas no mês baseado em intern_schedules
async function calcExpectedMinutes(db: any, internId: string, year: number, mon: number): Promise<number> {
  const { data: schedules } = await db
    .from('intern_schedules')
    .select('day_of_week, expected_hours')
    .eq('intern_id', internId)
    .eq('is_active', true)

  if (!schedules?.length) return 0

  const daysInMonth = new Date(year, mon, 0).getDate()
  let totalMin = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, mon - 1, d).getDay()
    const sch = schedules.find((s: any) => s.day_of_week === dow)
    if (sch?.expected_hours) totalMin += sch.expected_hours * 60
  }
  return totalMin
}

// ── Metadados comuns a todos os relatórios ────────────────────────────────────
async function baseMeta(authClient: any, db: any, userId: string, label: string) {
  const { data: admin }    = await authClient.from('profiles').select('full_name').eq('id', userId).single()
  const { data: settings } = await db.from('settings').select('lab_name').single()
  return {
    supervisor: admin?.full_name ?? 'Supervisor',
    labName:    settings?.lab_name ?? 'Laboratório Chronos Lab',
    period:     label,
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: authProfile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (authProfile?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const report   = searchParams.get('report')   ?? 'summary'
  const month    = searchParams.get('month')    ?? new Date().toISOString().slice(0, 7)
  const internId = searchParams.get('internId') ?? ''

  const db = createSupabaseServiceClient()
  const { startDate, endDate, label, year, mon } = periodFromMonth(month)
  const base = await baseMeta(authClient, db, user.id, label)

  // ── attendance: frequência individual ─────────────────────────────────────
  if (report === 'attendance') {
    const { data: intern } = await db
      .from('profiles')
      .select('full_name, course, internship_start, total_hours_required')
      .eq('id', internId).single()

    const { data: rawRec } = await db
      .from('time_records')
      .select('clock_in, clock_out, duration_minutes, status, is_late, activities')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })

    const records = list(rawRec)
    const approved    = records.filter(r => r.status === 'approved')
    const realMin     = approved.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const expectedMin = await calcExpectedMinutes(db, internId, year, mon)
    const pendMin     = Math.max(0, expectedMin - realMin)
    const excessMin   = Math.max(0, realMin - expectedMin)
    const today       = new Date().toISOString().slice(0, 10)
    const diasReg     = new Set(records.map(r => r.clock_in?.slice(0, 10))).size
    const inconsist   = records.filter(r => !r.clock_out && r.clock_in && r.clock_in < today).length
    const pct         = expectedMin > 0 ? Math.min(100, Math.round((realMin / expectedMin) * 100)) : 0
    const realH       = mh(realMin)
    const expH        = expectedMin > 0 ? mh(expectedMin) : '—'

    return NextResponse.json({
      ...base,
      internName:  intern?.full_name,
      tableTitle:  'REGISTROS DE PONTO',
      showSignatures: true,
      internInfo: {
        nome:       intern?.full_name ?? '—',
        curso:      intern?.course    ?? '—',
        dataInicio: intern?.internship_start ? fmtDate(intern.internship_start) : '—',
        semestre:   '—',
      },
      summaryCards: [
        { label: 'Horas Previstas',   value: expH,            colorKey: 'gray'   },
        { label: 'Horas Realizadas',  value: realH,           colorKey: 'green'  },
        { label: 'Horas Pendentes',   value: mh(pendMin),     colorKey: 'red'    },
        { label: 'Horas Excedentes',  value: mh(excessMin),   colorKey: 'blue'   },
        { label: 'Dias Registrados',  value: `${diasReg}d`,   colorKey: 'teal'   },
        { label: 'Inconsistências',   value: String(inconsist), colorKey: 'orange' },
      ],
      progressBar: expectedMin > 0
        ? { pct, label: `${pct}% · ${realH} de ${expH}` }
        : undefined,
      totals: [
        { label: 'TOTAL REGISTRADO', value: realH },
        { label: 'HORAS PENDENTES',  value: mh(pendMin) },
      ],
      columns: [
        { header: 'Data',            dataKey: 'data',     width: 38 },
        { header: 'Dia',             dataKey: 'dia',      width: 30 },
        { header: 'Entrada / Saída', dataKey: 'horario',  width: 80 },
        { header: 'Total',           dataKey: 'total',    width: 52 },
        { header: 'Atividade',       dataKey: 'atividade' },
      ],
      rows: records.map(r => ({
        data:      r.clock_in ? fmtDate(r.clock_in).slice(0, 5) : '—',
        dia:       r.clock_in ? dayName(r.clock_in) : '—',
        horario:   r.clock_in
          ? `${fmtTime(r.clock_in)}${r.clock_out ? ' - ' + fmtTime(r.clock_out) : ' (em aberto)'}`
          : '—',
        total:     r.duration_minutes ? mh(r.duration_minutes) : '—',
        atividade: Array.isArray(r.activities) && r.activities.length > 0
          ? r.activities[0].substring(0, 60) + (r.activities[0].length > 60 ? '…' : '')
          : '—',
      })),
    })
  }

  // ── hours: horas trabalhadas ───────────────────────────────────────────────
  if (report === 'hours') {
    const { data: intern } = await db
      .from('profiles').select('full_name, course, internship_start').eq('id', internId).single()

    const { data: rawRec } = await db
      .from('time_records')
      .select('clock_in, clock_out, duration_minutes, status')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })

    const records  = list(rawRec)
    const approved = records.filter(r => r.status === 'approved')
    const pending  = records.filter(r => r.status === 'pending')
    const totalMin = approved.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const avgMin   = approved.length > 0 ? Math.round(totalMin / approved.length) : 0
    const expectedMin = await calcExpectedMinutes(db, internId, year, mon)

    return NextResponse.json({
      ...base,
      internName: intern?.full_name,
      tableTitle: 'DETALHAMENTO DAS SESSÕES',
      showSignatures: true,
      internInfo: {
        nome:       intern?.full_name ?? '—',
        curso:      intern?.course    ?? '—',
        dataInicio: intern?.internship_start ? fmtDate(intern.internship_start) : '—',
        semestre:   '—',
      },
      summaryCards: [
        { label: 'Total Aprovado',   value: mh(totalMin),          colorKey: 'green'  },
        { label: 'Sessões Aprovadas', value: String(approved.length), colorKey: 'teal' },
        { label: 'Sessões Pendentes', value: String(pending.length),  colorKey: 'orange' },
        { label: 'Média por Sessão', value: mh(avgMin),             colorKey: 'blue'   },
        { label: 'Horas Previstas',  value: expectedMin > 0 ? mh(expectedMin) : '—', colorKey: 'gray' },
      ],
      columns: [
        { header: 'Data',    dataKey: 'data',   width: 58 },
        { header: 'Entrada', dataKey: 'entrada', width: 52 },
        { header: 'Saída',   dataKey: 'saida',   width: 52 },
        { header: 'Duração', dataKey: 'duracao', width: 62 },
        { header: 'Status',  dataKey: 'status' },
      ],
      totals: [
        { label: 'TOTAL APROVADO', value: mh(totalMin) },
        { label: 'SESSÕES',        value: `${approved.length} aprovadas · ${pending.length} pendentes` },
      ],
      rows: records.map(r => ({
        data:    r.clock_in  ? fmtDate(r.clock_in)  : '—',
        entrada: r.clock_in  ? fmtTime(r.clock_in)  : '—',
        saida:   r.clock_out ? fmtTime(r.clock_out) : '—',
        duracao: r.duration_minutes ? mh(r.duration_minutes) : '—',
        status:  r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
      })),
    })
  }

  // ── punctuality: pontualidade ──────────────────────────────────────────────
  if (report === 'punctuality') {
    const { data: intern } = await db
      .from('profiles').select('full_name, course, internship_start').eq('id', internId).single()

    const { data: rawRec } = await db
      .from('time_records')
      .select('clock_in, is_late, status')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })

    const records  = list(rawRec)
    const approved = records.filter(r => r.status === 'approved')
    const late     = approved.filter(r => r.is_late).length
    const onTime   = approved.length - late
    const rate     = approved.length > 0 ? Math.round((onTime / approved.length) * 100) : 100

    return NextResponse.json({
      ...base,
      internName: intern?.full_name,
      tableTitle: 'REGISTROS DE PONTUALIDADE',
      showSignatures: true,
      internInfo: {
        nome:       intern?.full_name ?? '—',
        curso:      intern?.course    ?? '—',
        dataInicio: intern?.internship_start ? fmtDate(intern.internship_start) : '—',
        semestre:   '—',
      },
      summaryCards: [
        { label: 'Taxa de Pontualidade', value: `${rate}%`,         colorKey: rate >= 80 ? 'green' : 'orange' },
        { label: 'Dias Pontuais',        value: String(onTime),     colorKey: 'green'  },
        { label: 'Atrasos',              value: String(late),       colorKey: 'red'    },
        { label: 'Total de Sessões',     value: String(approved.length), colorKey: 'blue' },
      ],
      columns: [
        { header: 'Data',    dataKey: 'data',    width: 58 },
        { header: 'Entrada', dataKey: 'entrada', width: 52 },
        { header: 'Pontual', dataKey: 'pontual', width: 50 },
        { header: 'Status',  dataKey: 'status' },
      ],
      totals: [
        { label: 'PONTUALIDADE GERAL', value: `${rate}% (${onTime} pontuais de ${approved.length})` },
      ],
      rows: records.map(r => ({
        data:    r.clock_in ? fmtDate(r.clock_in) : '—',
        entrada: r.clock_in ? fmtTime(r.clock_in) : '—',
        pontual: r.is_late ? 'Não' : 'Sim',
        status:  r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
      })),
    })
  }

  // ── activities: atividades realizadas ─────────────────────────────────────
  if (report === 'activities') {
    const { data: intern } = await db
      .from('profiles').select('full_name, course, internship_start').eq('id', internId).single()

    const { data: rawRec } = await db
      .from('time_records')
      .select('clock_in, activities')
      .eq('intern_id', internId)
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: false })

    const rows: Record<string, string>[] = []
    let total = 0
    for (const r of list(rawRec)) {
      const acts = Array.isArray(r.activities) ? r.activities : []
      for (const act of acts) {
        rows.push({
          data:      r.clock_in ? fmtDate(r.clock_in) : '—',
          atividade: act,
        })
        total++
      }
    }

    return NextResponse.json({
      ...base,
      internName: intern?.full_name,
      tableTitle: 'ATIVIDADES DOCUMENTADAS',
      showSignatures: true,
      internInfo: {
        nome:       intern?.full_name ?? '—',
        curso:      intern?.course    ?? '—',
        dataInicio: intern?.internship_start ? fmtDate(intern.internship_start) : '—',
        semestre:   '—',
      },
      summaryCards: [
        { label: 'Total de Atividades', value: String(total), colorKey: 'green' },
        { label: 'Dias com Registro',   value: String(new Set(rows.map(r => r.data)).size), colorKey: 'teal' },
      ],
      totals: [{ label: 'TOTAL DE ATIVIDADES DOCUMENTADAS', value: String(total) }],
      columns: [
        { header: 'Data',      dataKey: 'data',      width: 58 },
        { header: 'Atividade', dataKey: 'atividade' },
      ],
      rows,
    })
  }

  // ── sheet: ficha completa ─────────────────────────────────────────────────
  if (report === 'sheet') {
    const { data: intern } = await db
      .from('profiles')
      .select('full_name, email, course, nickname, points, level, streak_days, created_at, internship_start, total_hours_required')
      .eq('id', internId).single()

    const { data: allRec } = await db
      .from('time_records').select('duration_minutes, status, is_late').eq('intern_id', internId)

    const approved = list(allRec).filter(r => r.status === 'approved')
    const totalMin = approved.reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const late     = approved.filter(r => r.is_late).length
    const rate     = approved.length > 0 ? Math.round(((approved.length - late) / approved.length) * 100) : 100
    const wlMin    = (intern?.total_hours_required ?? 0) * 60
    const pct      = wlMin > 0 ? Math.min(100, Math.round((totalMin / wlMin) * 100)) : 0

    return NextResponse.json({
      ...base,
      internName: intern?.full_name,
      tableTitle: 'DADOS DO ESTÁGIO',
      showSignatures: true,
      internInfo: {
        nome:       intern?.full_name ?? '—',
        curso:      intern?.course    ?? '—',
        dataInicio: intern?.internship_start ? fmtDate(intern.internship_start) : '—',
        semestre:   '—',
      },
      summaryCards: [
        { label: 'Horas Cumpridas',     value: mh(totalMin),           colorKey: 'green'  },
        { label: 'Carga Total',         value: `${intern?.total_hours_required ?? 0}h`, colorKey: 'gray' },
        { label: 'Conclusão',           value: `${pct}%`,              colorKey: pct >= 80 ? 'green' : 'orange' },
        { label: 'Pontuação',           value: `${intern?.points ?? 0}`, colorKey: 'teal' },
        { label: 'Nível',               value: String(intern?.level ?? 1), colorKey: 'blue' },
        { label: 'Sequência',           value: `${intern?.streak_days ?? 0}d`, colorKey: 'orange' },
      ],
      progressBar: wlMin > 0
        ? { pct, label: `${pct}% · ${mh(totalMin)} de ${intern?.total_hours_required ?? 0}h cumpridas` }
        : undefined,
      columns: [
        { header: 'Campo', dataKey: 'campo', width: 55 },
        { header: 'Valor', dataKey: 'valor' },
      ],
      rows: [
        { campo: 'Nome completo',      valor: intern?.full_name ?? '—' },
        { campo: 'E-mail',             valor: intern?.email ?? '—' },
        { campo: 'Curso',              valor: intern?.course ?? '—' },
        { campo: 'Apelido',            valor: intern?.nickname ?? '—' },
        { campo: 'Início do estágio',  valor: intern?.internship_start ? fmtDate(intern.internship_start) : '—' },
        { campo: 'Carga prevista',     valor: `${intern?.total_hours_required ?? 0}h` },
        { campo: 'Horas cumpridas',    valor: mh(totalMin) },
        { campo: 'Conclusão',          valor: `${pct}%` },
        { campo: 'Sessões aprovadas',  valor: String(approved.length) },
        { campo: 'Pontualidade',       valor: `${rate}%` },
        { campo: 'Pontos',             valor: String(intern?.points ?? 0) },
        { campo: 'Nível',              valor: String(intern?.level ?? 1) },
        { campo: 'Sequência atual',    valor: `${intern?.streak_days ?? 0} dias` },
      ],
    })
  }

  // ── workload: carga horária restante ──────────────────────────────────────
  if (report === 'workload') {
    const { data: intern } = await db
      .from('profiles').select('full_name, course, internship_start, total_hours_required').eq('id', internId).single()

    const { data: allRec } = await db
      .from('time_records').select('duration_minutes, status').eq('intern_id', internId).eq('status', 'approved')

    const totalMin  = list(allRec).reduce((a, r) => a + (r.duration_minutes ?? 0), 0)
    const wlMin     = (intern?.total_hours_required ?? 0) * 60
    const remainMin = Math.max(0, wlMin - totalMin)
    const pct       = wlMin > 0 ? Math.min(100, Math.round((totalMin / wlMin) * 100)) : 0

    return NextResponse.json({
      ...base,
      internName: intern?.full_name,
      tableTitle: 'DETALHAMENTO DA CARGA HORÁRIA',
      showSignatures: true,
      internInfo: {
        nome:       intern?.full_name ?? '—',
        curso:      intern?.course    ?? '—',
        dataInicio: intern?.internship_start ? fmtDate(intern.internship_start) : '—',
        semestre:   '—',
      },
      summaryCards: [
        { label: 'Carga Total',      value: `${intern?.total_hours_required ?? 0}h`, colorKey: 'gray'   },
        { label: 'Horas Cumpridas',  value: mh(totalMin),             colorKey: 'green'  },
        { label: 'Horas Restantes',  value: mh(remainMin),            colorKey: pct >= 80 ? 'teal' : 'red' },
        { label: 'Concluído',        value: `${pct}%`,                colorKey: pct >= 100 ? 'green' : pct >= 50 ? 'blue' : 'orange' },
        { label: 'Sessões Aprovadas', value: String(allRec?.length ?? 0), colorKey: 'teal' },
      ],
      progressBar: { pct, label: `${pct}% concluído · ${mh(totalMin)} de ${intern?.total_hours_required ?? 0}h` },
      columns: [
        { header: 'Métrica', dataKey: 'metrica', width: 70 },
        { header: 'Valor',   dataKey: 'valor' },
      ],
      rows: [
        { metrica: 'Carga horária total',   valor: `${intern?.total_hours_required ?? 0}h` },
        { metrica: 'Horas cumpridas',       valor: mh(totalMin) },
        { metrica: 'Horas restantes',       valor: mh(remainMin) },
        { metrica: 'Percentual concluído',  valor: `${pct}%` },
        { metrica: 'Sessões aprovadas',     valor: String(allRec?.length ?? 0) },
      ],
    })
  }

  // ── summary: resumo mensal geral ──────────────────────────────────────────
  if (report === 'summary') {
    const { data: interns } = await db
      .from('profiles').select('id, full_name, course').eq('role', 'intern').eq('is_active', true).order('full_name')
    const { data: records } = await db
      .from('time_records').select('intern_id, duration_minutes, status, is_late')
      .gte('clock_in', startDate).lt('clock_in', endDate)

    const map = new Map<string, { name: string; course: string; min: number; sessions: number; approved: number; late: number }>(
      withId(interns).map(i => [i.id, { name: i.full_name ?? '', course: i.course ?? '', min: 0, sessions: 0, approved: 0, late: 0 }])
    )
    for (const r of list(records)) {
      if (!r.intern_id) continue
      const e = map.get(r.intern_id)
      if (e) {
        e.sessions++
        if (r.status === 'approved') { e.approved++; e.min += r.duration_minutes ?? 0 }
        if (r.is_late) e.late++
      }
    }

    const rows = Array.from(map.values())
    const totalMin = rows.reduce((a, r) => a + r.min, 0)
    const totalSes = rows.reduce((a, r) => a + r.sessions, 0)
    const present  = rows.filter(r => r.sessions > 0).length

    return NextResponse.json({
      ...base,
      tableTitle: 'RESUMO POR ESTAGIÁRIO',
      summaryCards: [
        { label: 'Estagiários Ativos', value: String(rows.length),   colorKey: 'gray'  },
        { label: 'Com Registros',      value: String(present),       colorKey: 'green' },
        { label: 'Total de Horas',     value: mh(totalMin),          colorKey: 'teal'  },
        { label: 'Total de Sessões',   value: String(totalSes),      colorKey: 'blue'  },
      ],
      columns: [
        { header: 'Estagiário', dataKey: 'nome' },
        { header: 'Curso',      dataKey: 'curso',     width: 110 },
        { header: 'Horas',      dataKey: 'horas',     width: 48 },
        { header: 'Sessões',    dataKey: 'sessoes',   width: 48 },
        { header: 'Aprovadas',  dataKey: 'aprovadas', width: 48 },
        { header: 'Atrasos',    dataKey: 'atrasos',   width: 48 },
      ],
      totals: [
        { label: 'TOTAL DE HORAS',   value: mh(totalMin) },
        { label: 'TOTAL DE SESSÕES', value: String(totalSes) },
      ],
      rows: rows.map(e => ({
        nome:      e.name,
        curso:     e.course || '—',
        horas:     mh(e.min),
        sessoes:   String(e.sessions),
        aprovadas: String(e.approved),
        atrasos:   String(e.late),
      })),
    })
  }

  // ── daily_log: diário de ponto ─────────────────────────────────────────────
  if (report === 'daily_log') {
    const { data: interns } = await db
      .from('profiles').select('id, full_name').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db
      .from('time_records').select('intern_id, clock_in, clock_out, duration_minutes, status')
      .gte('clock_in', startDate).lt('clock_in', endDate)
      .order('clock_in', { ascending: true })

    const nameMap = new Map(withId(interns).map(i => [i.id, i.full_name ?? '—']))
    const rows = list(records).map(r => ({
      nome:    nameMap.get(r.intern_id ?? '') ?? '—',
      data:    r.clock_in ? fmtDate(r.clock_in) : '—',
      dia:     r.clock_in ? dayName(r.clock_in) : '—',
      entrada: r.clock_in  ? fmtTime(r.clock_in)  : '—',
      saida:   r.clock_out ? fmtTime(r.clock_out) : '—',
      duracao: r.duration_minutes ? mh(r.duration_minutes) : '—',
      status:  r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Reprovado',
    }))

    return NextResponse.json({
      ...base,
      tableTitle: 'DIÁRIO DE PONTO',
      summaryCards: [
        { label: 'Total de Registros', value: String(rows.length), colorKey: 'green' },
      ],
      columns: [
        { header: 'Estagiário', dataKey: 'nome' },
        { header: 'Data',       dataKey: 'data',    width: 48 },
        { header: 'Dia',        dataKey: 'dia',     width: 32 },
        { header: 'Entrada',    dataKey: 'entrada', width: 44 },
        { header: 'Saída',      dataKey: 'saida',   width: 44 },
        { header: 'Duração',    dataKey: 'duracao', width: 52 },
        { header: 'Status',     dataKey: 'status',  width: 55 },
      ],
      rows,
    })
  }

  // ── by_course: horas por curso ────────────────────────────────────────────
  if (report === 'by_course') {
    const { data: interns } = await db
      .from('profiles').select('id, course').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db
      .from('time_records').select('intern_id, duration_minutes, status')
      .gte('clock_in', startDate).lt('clock_in', endDate).eq('status', 'approved')

    const courseMap  = new Map<string, { min: number; count: number; interns: Set<string> }>()
    const internCourse = new Map(withId(interns).map(i => [i.id, i.course ?? 'Não informado']))

    for (const r of list(records)) {
      if (!r.intern_id) continue
      const course = internCourse.get(r.intern_id) ?? 'Não informado'
      const e = courseMap.get(course) ?? { min: 0, count: 0, interns: new Set() }
      e.min += r.duration_minutes ?? 0
      e.count++
      e.interns.add(r.intern_id)
      courseMap.set(course, e)
    }

    const rows = Array.from(courseMap.entries())
      .map(([curso, e]) => ({
        curso,
        horas:      mh(e.min),
        sessoes:    String(e.count),
        estagiarios: String(e.interns.size),
        _min:       e.min,
      }))
      .sort((a, b) => b._min - a._min)
      .map(({ _min: _, ...rest }) => rest)

    return NextResponse.json({
      ...base,
      tableTitle: 'HORAS POR CURSO',
      summaryCards: [
        { label: 'Cursos com Registro', value: String(courseMap.size), colorKey: 'teal' },
      ],
      columns: [
        { header: 'Curso',        dataKey: 'curso' },
        { header: 'Horas',        dataKey: 'horas',        width: 60 },
        { header: 'Sessões',      dataKey: 'sessoes',      width: 60 },
        { header: 'Estagiários',  dataKey: 'estagiarios',  width: 70 },
      ],
      rows,
    })
  }

  // ── ending_soon: próximos do encerramento ─────────────────────────────────
  if (report === 'ending_soon') {
    const { data: interns } = await db
      .from('profiles').select('id, full_name, course, total_hours_required').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db
      .from('time_records').select('intern_id, duration_minutes').eq('status', 'approved')

    const minMap = new Map<string, number>()
    for (const r of list(records)) {
      if (!r.intern_id) continue
      minMap.set(r.intern_id, (minMap.get(r.intern_id) ?? 0) + (r.duration_minutes ?? 0))
    }

    const rows = withId(interns)
      .map(i => {
        const worked    = minMap.get(i.id) ?? 0
        const total     = (i.total_hours_required ?? 0) * 60
        const remaining = Math.max(0, total - worked)
        const pct       = total > 0 ? Math.round((worked / total) * 100) : 0
        return {
          nome:     i.full_name ?? '—',
          curso:    i.course ?? '—',
          cumprido: mh(worked),
          restante: mh(remaining),
          total:    `${i.total_hours_required ?? 0}h`,
          pct:      `${pct}%`,
          _pct:     pct,
        }
      })
      .filter(r => r._pct >= 70)
      .sort((a, b) => b._pct - a._pct)
      .map(({ _pct: _, ...rest }) => rest)

    return NextResponse.json({
      ...base,
      tableTitle: 'PRÓXIMOS DO ENCERRAMENTO',
      summaryCards: [
        { label: 'Estagiários ≥ 70%', value: String(rows.length), colorKey: rows.length > 0 ? 'orange' : 'green' },
      ],
      columns: [
        { header: 'Estagiário',  dataKey: 'nome' },
        { header: 'Curso',       dataKey: 'curso',    width: 110 },
        { header: 'Cumprido',    dataKey: 'cumprido', width: 55 },
        { header: 'Restante',    dataKey: 'restante', width: 55 },
        { header: 'Carga Total', dataKey: 'total',    width: 55 },
        { header: 'Conclusão',   dataKey: 'pct',      width: 55 },
      ],
      rows,
    })
  }

  // ── ranking_full: ranking completo ────────────────────────────────────────
  if (report === 'ranking_full') {
    const { data: interns } = await db
      .from('profiles').select('full_name, course, points, level').eq('role', 'intern').eq('is_active', true).order('points', { ascending: false })

    const rows = list(interns).map((i, idx) => ({
      pos:    `${idx + 1}º`,
      nome:   i.full_name ?? '—',
      curso:  i.course ?? '—',
      nivel:  String(i.level ?? 1),
      pontos: String(i.points ?? 0),
    }))

    return NextResponse.json({
      ...base,
      tableTitle: 'CLASSIFICAÇÃO GERAL POR PONTOS',
      summaryCards: [
        { label: 'Estagiários no Ranking', value: String(rows.length), colorKey: 'teal' },
        { label: '1º Lugar',               value: rows[0]?.nome?.split(' ')[0] ?? '—', colorKey: 'orange' },
      ],
      columns: [
        { header: '#',      dataKey: 'pos',    width: 24 },
        { header: 'Nome',   dataKey: 'nome' },
        { header: 'Curso',  dataKey: 'curso',  width: 130 },
        { header: 'Nível',  dataKey: 'nivel',  width: 40 },
        { header: 'Pontos', dataKey: 'pontos', width: 50 },
      ],
      rows,
    })
  }

  // ── ranking_punctuality ───────────────────────────────────────────────────
  if (report === 'ranking_punctuality') {
    const { data: interns } = await db
      .from('profiles').select('id, full_name').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db
      .from('time_records').select('intern_id, is_late, status')
      .gte('clock_in', startDate).lt('clock_in', endDate).eq('status', 'approved')

    const map = new Map<string, { name: string; total: number; onTime: number }>()
    for (const i of withId(interns)) map.set(i.id, { name: i.full_name ?? '', total: 0, onTime: 0 })
    for (const r of list(records)) {
      if (!r.intern_id) continue
      const e = map.get(r.intern_id)
      if (e) { e.total++; if (!r.is_late) e.onTime++ }
    }

    const rows = Array.from(map.values())
      .filter(e => e.total > 0)
      .sort((a, b) => (b.onTime / b.total) - (a.onTime / a.total))
      .map((e, idx) => ({
        pos:    `${idx + 1}º`,
        nome:   e.name,
        ontime: String(e.onTime),
        late:   String(e.total - e.onTime),
        taxa:   `${Math.round((e.onTime / e.total) * 100)}%`,
      }))

    return NextResponse.json({
      ...base,
      tableTitle: 'RANKING DE PONTUALIDADE',
      summaryCards: [
        { label: 'No Ranking', value: String(rows.length), colorKey: 'teal' },
        { label: 'Mais Pontual', value: rows[0]?.nome?.split(' ')[0] ?? '—', colorKey: 'green' },
      ],
      columns: [
        { header: '#',        dataKey: 'pos',    width: 24 },
        { header: 'Nome',     dataKey: 'nome' },
        { header: 'Pontuais', dataKey: 'ontime', width: 60 },
        { header: 'Atrasos',  dataKey: 'late',   width: 55 },
        { header: 'Taxa',     dataKey: 'taxa',   width: 50 },
      ],
      rows,
    })
  }

  // ── ranking_activities ────────────────────────────────────────────────────
  if (report === 'ranking_activities') {
    const { data: interns } = await db
      .from('profiles').select('id, full_name').eq('role', 'intern').eq('is_active', true)
    const { data: records } = await db
      .from('time_records').select('intern_id, activities')
      .gte('clock_in', startDate).lt('clock_in', endDate)

    const map = new Map<string, { name: string; count: number }>()
    for (const i of withId(interns)) map.set(i.id, { name: i.full_name ?? '', count: 0 })
    for (const r of list(records)) {
      if (!r.intern_id) continue
      const e = map.get(r.intern_id)
      if (e && Array.isArray(r.activities)) e.count += r.activities.length
    }

    const rows = Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .map((e, idx) => ({
        pos:   `${idx + 1}º`,
        nome:  e.name,
        count: String(e.count),
      }))

    return NextResponse.json({
      ...base,
      tableTitle: 'RANKING DE ATIVIDADES DOCUMENTADAS',
      summaryCards: [
        { label: 'No Ranking', value: String(rows.filter(r => Number(r.count) > 0).length), colorKey: 'teal' },
        { label: 'Mais Ativo', value: rows[0]?.nome?.split(' ')[0] ?? '—', colorKey: 'blue' },
      ],
      columns: [
        { header: '#',          dataKey: 'pos',   width: 12 },
        { header: 'Nome',       dataKey: 'nome',  width: 80 },
        { header: 'Atividades', dataKey: 'count', width: 30 },
      ],
      rows,
    })
  }

  // ── hall_of_fame ──────────────────────────────────────────────────────────
  if (report === 'hall_of_fame') {
    const { data: interns } = await db
      .from('profiles').select('full_name, points, level, streak_days').eq('role', 'intern')
      .order('points', { ascending: false }).limit(20)

    const rows = list(interns).map((i, idx) => ({
      pos:    `${idx + 1}º`,
      nome:   i.full_name ?? '—',
      pontos: String(i.points ?? 0),
      nivel:  String(i.level ?? 1),
      streak: `${i.streak_days ?? 0} dias`,
    }))

    return NextResponse.json({
      ...base,
      tableTitle: 'HALL DA FAMA — OS MELHORES DE TODOS OS TEMPOS',
      summaryCards: [
        { label: 'No Hall da Fama', value: String(rows.length),              colorKey: 'orange' },
        { label: 'Campeão',         value: rows[0]?.nome?.split(' ')[0] ?? '—', colorKey: 'teal' },
        { label: 'Maior Pontuação', value: rows[0]?.pontos ? `${rows[0].pontos} pts` : '—', colorKey: 'green' },
      ],
      columns: [
        { header: '#',         dataKey: 'pos',    width: 24 },
        { header: 'Nome',      dataKey: 'nome' },
        { header: 'Pontos',    dataKey: 'pontos', width: 60 },
        { header: 'Nível',     dataKey: 'nivel',  width: 40 },
        { header: 'Sequência', dataKey: 'streak', width: 65 },
      ],
      rows,
    })
  }

  return NextResponse.json({ columns: [], rows: [] })
}
