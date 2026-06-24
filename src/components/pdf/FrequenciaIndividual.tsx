import React from 'react'
import {
  Document, Page, Text, View, StyleSheet,
  Svg, Rect, Circle, Line, Path, Font,
} from '@react-pdf/renderer'
import path from 'path'

// ── Fontes ───────────────────────────────────────────────────────────────────
const FONT_DIR = path.join(process.cwd(), 'src/components/pdf/fonts')
Font.register({
  family: 'Poppins',
  fonts: [
    { src: `${FONT_DIR}/Poppins-Regular.ttf`,  fontWeight: 400 },
    { src: `${FONT_DIR}/Poppins-Medium.ttf`,   fontWeight: 500 },
    { src: `${FONT_DIR}/Poppins-SemiBold.ttf`, fontWeight: 600 },
    { src: `${FONT_DIR}/Poppins-Bold.ttf`,     fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback(w => [w])

// ── Paleta (fiel ao reference) ────────────────────────────────────────────────
const C = {
  white:      '#ffffff',
  pageBg:     '#ffffff',
  secBar:     '#122216',   // barra de seção (verde escuro)
  secText:    '#3fe56c',   // texto na barra de seção
  green:      '#1a9c45',
  greenLight: '#eaf7ee',
  greenMid:   '#c6ecd2',
  red:        '#c0392b',
  blue:       '#2563eb',
  orange:     '#d97706',
  yellow:     '#ca8a04',
  gray:       '#6b7280',
  border:     '#d1d5db',
  borderCard: '#e5e7eb',
  rowAlt:     '#f4f8f4',
  text:       '#111827',
  textSub:    '#374151',
  textMuted:  '#9ca3af',
  textLight:  '#d1d5db',
  footerBg:   '#eef4ee',
}

const M  = 14   // margem horizontal
const CW = 210 - M * 2  // largura do conteúdo

// ── Tipos ────────────────────────────────────────────────────────────────────
export type ActivityRecord = {
  date:       string         // "22/06/2026"
  clockIn:    string         // "08:00"
  clockOut:   string | null  // "17:00"
  duration:   string         // "8h30"
  status:     'approved' | 'pending' | 'rejected'
  activities: string[]
}

export type FrequenciaProps = {
  studentName:       string
  course?:           string
  semester?:         string
  internshipStart?:  string
  period:            { start: string; end: string }
  records:           ActivityRecord[]
  totalHours:        string
  requiredHours?:    string
  excessHours?:      string
  pendingHours?:     string
  totalSessions:     number
  approvedSessions:  number
  inconsistencies?:  number
  supervisorName?:   string
  institutionName?:  string
  periodLabel?:      string
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.pageBg,
    fontFamily:      'Poppins',
    paddingHorizontal: M,
    paddingBottom:   14,
    paddingTop:      0,
    fontSize:        9,
    color:           C.text,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  topStrip: { height: 3, backgroundColor: C.green, marginHorizontal: -M },
  headerWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderColor: C.borderCard,
    marginBottom: 10,
  },
  logoBox: { width: 42, alignItems: 'center', justifyContent: 'center' },
  titleBox: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: 0.5 },
  rightBox: { width: 100, alignItems: 'flex-end' },
  rightLab:    { fontSize: 8.5, fontWeight: 700, color: C.text },
  rightSup:    { fontSize: 7.5, fontWeight: 400, color: C.textSub, marginTop: 2 },
  rightPeriod: { fontSize: 7.5, fontWeight: 400, color: C.green,   marginTop: 2 },
  rightEmit:   { fontSize: 7.5, fontWeight: 400, color: C.textMuted, marginTop: 2 },

  // ── Barra de seção ───────────────────────────────────────────────────────────
  secBar: {
    backgroundColor: C.secBar,
    marginHorizontal: -M,
    paddingHorizontal: M,
    paddingVertical: 6,
    marginBottom: 0,
  },
  secBarText: { fontSize: 8.5, fontWeight: 700, color: C.secText, letterSpacing: 0.8 },

  // ── Grid info do estagiário ───────────────────────────────────────────────
  infoGrid: {
    borderWidth: 1, borderColor: C.borderCard,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.borderCard },
  infoRowLast: { flexDirection: 'row' },
  infoCell: {
    flex: 1, paddingHorizontal: 10, paddingVertical: 9,
    borderRightWidth: 1, borderColor: C.borderCard,
  },
  infoCellLast: { borderRightWidth: 0 },
  infoLabel: {
    fontSize: 6, fontWeight: 600, color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3,
  },
  infoValue: { fontSize: 10.5, fontWeight: 600, color: C.text },

  // ── Cards de resumo ───────────────────────────────────────────────────────
  cardsWrap: {
    flexDirection: 'row', marginBottom: 0,
    borderWidth: 1, borderColor: C.borderCard,
  },
  card: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderRightWidth: 1, borderColor: C.borderCard,
  },
  cardLast: { borderRightWidth: 0 },
  cardAccent: { height: 3, width: '100%', marginBottom: 8 },
  cardNum: { fontSize: 20, fontWeight: 700 },
  cardUnit: { fontSize: 11, fontWeight: 500 },
  cardLabel: {
    fontSize: 6.5, fontWeight: 400, color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4,
    textAlign: 'center',
  },

  // ── Progress bar ─────────────────────────────────────────────────────────
  progressOuter: {
    height: 24, backgroundColor: '#c6ecd2',
    marginBottom: 10, justifyContent: 'center',
    position: 'relative',
  },

  // ── Tabela ────────────────────────────────────────────────────────────────
  tableWrap: { borderWidth: 1, borderColor: C.borderCard, marginBottom: 10 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.secBar,
    paddingVertical: 7, paddingHorizontal: 6,
  },
  thCell: {
    fontSize: 8, fontWeight: 700, color: C.secText,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6,
    borderTopWidth: 1, borderColor: C.borderCard,
    alignItems: 'flex-start',
  },
  td:       { fontSize: 8.5, color: C.text },
  tdSub:    { fontSize: 8,   color: C.textSub, marginTop: 1.5 },
  tdMuted:  { fontSize: 8,   color: C.textMuted },

  cDate: { width: '9%' },
  cDay:  { width: '7%' },
  cTime: { width: '22%' },
  cDur:  { width: '10%' },
  cAct:  { flex: 1 },

  // ── Totais ───────────────────────────────────────────────────────────────
  totalsBox: {
    backgroundColor: C.greenLight,
    borderWidth: 1, borderColor: C.greenMid,
    padding: 12, marginBottom: 10,
  },
  totalLine: { flexDirection: 'row', marginBottom: 6 },
  totalLineLast: { flexDirection: 'row' },
  totalLabel: { fontSize: 9, fontWeight: 700, color: C.textSub, width: 120 },
  totalValue: { fontSize: 9, fontWeight: 700, color: C.green },

  // ── Observações ───────────────────────────────────────────────────────────
  obsText: { fontSize: 8.5, color: C.textSub, lineHeight: 1.6, padding: 10 },

  // ── Assinaturas ──────────────────────────────────────────────────────────
  sigWrap: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 14, paddingTop: 20, gap: 30 },
  sigBox:  { flex: 1, alignItems: 'center' },
  sigName: { fontSize: 9, fontWeight: 700, color: C.text, marginTop: 6 },
  sigRole: { fontSize: 7.5, color: C.textMuted, marginTop: 2 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.footerBg,
    borderTopWidth: 1, borderColor: C.borderCard,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: M, paddingVertical: 5,
  },
  footerLeft:  { fontSize: 6.5, color: C.textMuted },
  footerRight: { fontSize: 8,   fontWeight: 700, color: C.red },
})

// ── Logo SVG (fiel ao reference: relógio + texto) ─────────────────────────────
function Logo() {
  const r = 12, cx = 14, cy = 14
  return (
    <Svg width="38" height="38" viewBox="0 0 38 38">
      {/* Caixa arredondada fundo */}
      <Rect x="1" y="1" width="36" height="36" rx="7" fill={C.greenLight} stroke={C.green} strokeWidth="0.8" />
      {/* Face do relógio */}
      <Circle cx={cx} cy={cy} r={r} fill={C.white} stroke={C.green} strokeWidth="1.2" />
      {/* Ponteiro dos minutos (verde, apontando para 12) */}
      <Line x1={cx} y1={cy} x2={cx} y2={cy - 8} stroke={C.green} strokeWidth="1.4" strokeLinecap="round" />
      {/* Ponteiro das horas (vermelho, apontando para 3) */}
      <Line x1={cx} y1={cy} x2={cx + 6} y2={cy + 2} stroke={C.red} strokeWidth="1.6" strokeLinecap="round" />
      {/* Centro */}
      <Circle cx={cx} cy={cy} r="1.6" fill={C.green} />
      {/* Ticks 12/3/6/9 */}
      <Line x1={cx} y1={cy - r + 1} x2={cx} y2={cy - r + 3} stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx + r - 1} y1={cy} x2={cx + r - 3} y2={cy} stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx} y1={cy + r - 1} x2={cx} y2={cy + r - 3} stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx - r + 1} y1={cy} x2={cx - r + 3} y2={cy} stroke={C.green} strokeWidth="0.8" />
      {/* Haste coroa */}
      <Line x1={cx - 3} y1={cy - r - 0.5} x2={cx + 3} y2={cy - r - 0.5} stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx} y1={cy - r - 0.5} x2={cx} y2={cy - r - 2.5} stroke={C.green} strokeWidth="0.8" />
    </Svg>
  )
}

// ── SigLine ───────────────────────────────────────────────────────────────────
function SigLine() {
  return (
    <Svg width="200" height="1" viewBox="0 0 200 1">
      <Line x1="0" y1="0" x2="200" y2="0" stroke={C.borderCard} strokeWidth="0.8" />
    </Svg>
  )
}

// ── Progress bar (SVG para preencher largura exata) ───────────────────────────
function ProgressBar({ pct, label }: { pct: number; label: string }) {
  const W = CW
  const filled = Math.max(6, (W * Math.min(pct, 100)) / 100)
  return (
    <Svg width="100%" height="24" viewBox={`0 0 ${W} 24`}>
      <Rect x="0" y="0" width={W}      height="24" fill="#c6ecd2" />
      <Rect x="0" y="0" width={filled} height="24" fill={C.green} />
      <text
        x={W / 2} y="16"
        textAnchor="middle"
        fontFamily="Helvetica-Bold"
        fontSize="10"
        fill={C.white}
      >{label}</text>
    </Svg>
  )
}

// ── Header (repetido em cada página via fixed) ────────────────────────────────
function PageHeader({ institutionName, supervisorName, periodLabel, fixed = false }: {
  institutionName: string; supervisorName: string; periodLabel: string; fixed?: boolean
}) {
  const today = new Date().toLocaleDateString('pt-BR')
  return (
    <View fixed={fixed}>
      {/* Faixa verde topo */}
      <View style={s.topStrip} />
      <View style={s.headerWrap}>
        <View style={s.logoBox}><Logo /></View>
        <View style={s.titleBox}>
          <Text style={s.headerTitle}>RELATÓRIO DE FREQUÊNCIA</Text>
        </View>
        <View style={s.rightBox}>
          <Text style={s.rightLab}>{institutionName}</Text>
          {supervisorName ? <Text style={s.rightSup}>{supervisorName}</Text> : null}
          {periodLabel    ? <Text style={s.rightPeriod}>Período: {periodLabel}</Text> : null}
          <Text style={s.rightEmit}>Emissão: {today}</Text>
        </View>
      </View>
    </View>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function FrequenciaIndividual({
  studentName,
  course,
  semester,
  internshipStart,
  period,
  records,
  totalHours,
  requiredHours  = '160h',
  excessHours    = '0h',
  pendingHours,
  totalSessions,
  approvedSessions,
  inconsistencies = 0,
  supervisorName  = '',
  institutionName = 'Controle de Ponto',
  periodLabel,
}: FrequenciaProps) {
  // Calcula pendentes e progresso
  const reqN  = parseFloat(requiredHours.replace('h','').replace(',','.')) || 160
  const totN  = parseFloat(totalHours.replace(/[^\d.]/g,'')) || 0
  const pct   = Math.round((totN / reqN) * 100)
  const pendN = Math.max(reqN - totN, 0)
  const pendStr = pendingHours ?? `${pendN % 1 === 0 ? pendN : pendN.toFixed(1)}h`

  const pLabel = periodLabel ?? `${period.start} a ${period.end}`
  const barLabel = `${pct}% · ${totalHours} de ${requiredHours}`

  // Cards de stats (6, fiel ao reference)
  const CARDS = [
    { num: requiredHours,        label: 'Horas Previstas',    color: C.gray   },
    { num: totalHours,           label: 'Horas Realizadas',   color: C.green  },
    { num: pendStr,              label: 'Horas Pendentes',    color: C.red    },
    { num: excessHours,          label: 'Horas Excedentes',   color: C.yellow },
    { num: String(totalSessions),label: 'Dias Registrados',   color: C.blue   },
    { num: String(inconsistencies), label: 'Inconsistências', color: C.orange },
  ]

  const WEEKDAY: Record<number,string> = {0:'Dom',1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sáb'}
  function dow(dateStr: string) {
    const p = dateStr.split('/')
    if (p.length < 3) return ''
    const d = new Date(`${p[2]}-${p[1]}-${p[0]}`)
    return isNaN(d.getTime()) ? '' : WEEKDAY[d.getDay()] ?? ''
  }

  // Formata horário como "HH:MM - HH:MM"
  function fmtTime(r: ActivityRecord) {
    if (!r.clockIn || r.clockIn === '—') return '—'
    if (!r.clockOut) return r.clockIn
    return `${r.clockIn} - ${r.clockOut}`
  }

  return (
    <Document
      title={`Frequência Individual — ${studentName}`}
      author={institutionName}
      language="pt-BR"
    >
      <Page size="A4" style={[s.page, { paddingBottom: 36 }]}>

        {/* ══ HEADER ══ */}
        <PageHeader
          institutionName={institutionName}
          supervisorName={supervisorName}
          periodLabel={pLabel}
          fixed={false}
        />

        {/* ══ INFORMAÇÕES DO ESTAGIÁRIO ══ */}
        <View style={s.secBar}>
          <Text style={s.secBarText}>INFORMAÇÕES DO ESTAGIÁRIO</Text>
        </View>
        <View style={[s.infoGrid, { marginTop: 0 }]}>
          <View style={s.infoRow}>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>NOME{'\n'}COMPLETO</Text>
              <Text style={s.infoValue}>{studentName}</Text>
            </View>
            <View style={[s.infoCell, s.infoCellLast]}>
              <Text style={s.infoLabel}>DATA DE INÍCIO</Text>
              <Text style={s.infoValue}>{internshipStart ?? period.start}</Text>
            </View>
          </View>
          <View style={s.infoRowLast}>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>CURSO</Text>
              <Text style={s.infoValue}>{course ?? '—'}</Text>
            </View>
            <View style={[s.infoCell, s.infoCellLast]}>
              <Text style={s.infoLabel}>SEMESTRE</Text>
              <Text style={s.infoValue}>{semester ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* ══ RESUMO DO PERÍODO ══ */}
        <View style={s.secBar}>
          <Text style={s.secBarText}>RESUMO DO PERÍODO</Text>
        </View>
        <View style={s.cardsWrap}>
          {CARDS.map((c, i) => (
            <View key={i} style={[s.card, i === CARDS.length - 1 ? s.cardLast : {}]}>
              <View style={[s.cardAccent, { backgroundColor: c.color }]} />
              <Text style={[s.cardNum, { color: c.color }]}>{c.num}</Text>
              <Text style={s.cardLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginBottom: 10 }}>
          <ProgressBar pct={pct} label={barLabel} />
        </View>

        {/* ══ REGISTROS DE PONTO ══ */}
        <View style={s.secBar}>
          <Text style={s.secBarText}>REGISTROS DE PONTO</Text>
        </View>
        <View style={s.tableWrap}>
          {/* Cabeçalho */}
          <View style={s.tableHead}>
            <Text style={[s.thCell, s.cDate]}>Data</Text>
            <Text style={[s.thCell, s.cDay]}>Dia</Text>
            <Text style={[s.thCell, s.cTime]}>Entrada / Saída</Text>
            <Text style={[s.thCell, s.cDur]}>Total</Text>
            <Text style={[s.thCell, s.cAct]}>Atividade</Text>
          </View>

          {/* Linhas */}
          {records.map((r, i) => (
            <View key={i} wrap={false}
              style={[s.tableRow, i % 2 !== 0 ? { backgroundColor: C.rowAlt } : {}]}>
              <Text style={[s.td, s.cDate]}>{r.date.length > 5 ? r.date.slice(0,5) : r.date}</Text>
              <Text style={[s.tdSub, s.cDay]}>{dow(r.date)}</Text>
              <View style={s.cTime}>
                <Text style={s.td}>{fmtTime(r)}</Text>
              </View>
              <Text style={[s.td, s.cDur, { fontWeight: 600 }]}>{r.duration}</Text>
              <View style={s.cAct}>
                {r.activities.length > 0
                  ? r.activities.map((a, ai) => (
                      <Text key={ai} style={[s.td, { marginBottom: ai < r.activities.length - 1 ? 2 : 0 }]}>
                        {a}
                      </Text>
                    ))
                  : <Text style={s.tdMuted}>—</Text>
                }
              </View>
            </View>
          ))}

          {/* Totais na tabela */}
          <View style={[s.totalsBox, { margin: 0, borderWidth: 0, borderTopWidth: 1, borderRadius: 0 }]}>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>TOTAL REGISTRADO:</Text>
              <Text style={s.totalValue}>{totalHours}</Text>
            </View>
            <View style={s.totalLineLast}>
              <Text style={s.totalLabel}>HORAS PENDENTES:</Text>
              <Text style={[s.totalValue, { color: pendN > 0 ? C.red : C.green }]}>{pendStr}</Text>
            </View>
          </View>
        </View>

        {/* ══ OBSERVAÇÕES E VALIDAÇÃO ══ */}
        <View style={s.secBar} wrap={false}>
          <Text style={s.secBarText}>OBSERVAÇÕES E VALIDAÇÃO</Text>
        </View>
        <View style={{ borderWidth: 1, borderColor: C.borderCard, borderTopWidth: 0 }} wrap={false}>
          <Text style={s.obsText}>
            Este relatório foi gerado automaticamente pelo sistema {institutionName} com base nos registros
            de entrada e saída do estagiário no período indicado. Registros sem marcação de ponto devem
            ser verificados pelo supervisor responsável.
          </Text>

          {/* Assinaturas */}
          <View style={s.sigWrap}>
            <View style={s.sigBox}>
              <SigLine />
              <Text style={s.sigName}>{supervisorName || 'Supervisor / Responsável'}</Text>
              <Text style={s.sigRole}>Supervisor / Responsável</Text>
            </View>
            <View style={s.sigBox}>
              <SigLine />
              <Text style={s.sigName}>{studentName}</Text>
              <Text style={s.sigRole}>Estagiário(a)</Text>
            </View>
          </View>
        </View>

        {/* ══ FOOTER fixo ══ */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            {institutionName} · Sistema de Controle de Ponto para Estagiários · Documento gerado automaticamente
          </Text>
          <Text
            style={s.footerRight}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber}`}
          />
        </View>

      </Page>
    </Document>
  )
}
