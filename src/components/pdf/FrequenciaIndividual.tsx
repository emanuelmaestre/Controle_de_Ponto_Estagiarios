import React from 'react'
import {
  Document, Page, Text, View, StyleSheet,
  Svg, Rect, Circle, Line, Path, Font,
} from '@react-pdf/renderer'
import path from 'path'

// ── Fontes locais ────────────────────────────────────────────────────────────
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

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  white:       '#ffffff',
  bg:          '#f7f9f7',
  surface:     '#ffffff',
  border:      '#e2ede5',
  borderLight: '#eef4ee',
  primary:     '#1a9c45',
  primaryDark: '#126830',
  primaryBg:   '#eaf7ee',
  primaryMid:  '#c6ecd2',
  accent:      '#3fe56c',
  text:        '#1a2e1e',
  textSub:     '#4a6b52',
  textMuted:   '#8aab90',
  textLight:   '#adc7b2',
  success:     '#1a9c45',
  successBg:   '#eaf7ee',
  warning:     '#d97706',
  warningBg:   '#fef3c7',
  danger:      '#dc2626',
  dangerBg:    '#fee2e2',
  pending:     '#7c3aed',
  pendingBg:   '#ede9fe',
  rowAlt:      '#f3faf5',
  shadow:      'rgba(26,156,69,0.08)',
}

// ── Tipos ────────────────────────────────────────────────────────────────────
export type ActivityRecord = {
  date: string
  clockIn: string
  clockOut: string | null
  duration: string
  status: 'approved' | 'pending' | 'rejected'
  activities: string[]
}

export type FrequenciaProps = {
  studentName:      string
  course?:          string
  period:           { start: string; end: string }
  records:          ActivityRecord[]
  totalHours:       string
  requiredHours?:   string
  pendingHours?:    string
  totalSessions:    number
  approvedSessions: number
  supervisorName?:  string
  institutionName?: string
}

// ── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprovado',  color: C.success,  bg: C.successBg  },
  pending:  { label: 'Pendente',  color: C.warning,  bg: C.warningBg  },
  rejected: { label: 'Reprovado', color: C.danger,   bg: C.dangerBg   },
}

// ── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    fontFamily: 'Poppins',
    paddingHorizontal: 36,
    paddingTop: 0,
    paddingBottom: 48,
    fontSize: 9,
    color: C.text,
  },

  // ─── Header bar ───────────────────────────────────────────────────────────
  headerBar: {
    backgroundColor: C.primary,
    marginHorizontal: -36,
    paddingHorizontal: 36,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerBarFixed: {
    backgroundColor: C.primary,
    marginHorizontal: -36,
    paddingHorizontal: 36,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  headerMid: { flex: 1, marginLeft: 14 },
  headerTitle: {
    fontSize: 18, fontWeight: 700, color: C.white,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  headerSub: { fontSize: 8, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: 400 },
  headerRight: { alignItems: 'flex-end' },
  headerRightLine: { fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  headerRightLineMuted: { fontSize: 7.5, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  // ─── Section card ─────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: C.primaryBg,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: C.primaryMid,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardHeaderTitle: {
    fontSize: 8, fontWeight: 700, color: C.primaryDark,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  cardBody: { paddingHorizontal: 16, paddingVertical: 14 },

  // ─── Info grid ────────────────────────────────────────────────────────────
  infoGrid: { flexDirection: 'row', gap: 0 },
  infoCell: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 14,
    borderRightWidth: 1, borderColor: C.borderLight,
  },
  infoCellLast: { borderRightWidth: 0 },
  infoLabel: {
    fontSize: 6.5, fontWeight: 600, color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4,
  },
  infoValue: { fontSize: 11, fontWeight: 600, color: C.text },
  infoValueSm: { fontSize: 9.5, fontWeight: 600, color: C.text },

  // ─── Stats ────────────────────────────────────────────────────────────────
  statsGrid: { flexDirection: 'row', gap: 0 },
  statCell: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRightWidth: 1, borderColor: C.borderLight,
  },
  statCellLast: { borderRightWidth: 0 },
  statNum: { fontSize: 22, fontWeight: 700, color: C.primary },
  statUnit: { fontSize: 11, fontWeight: 500, color: C.textSub },
  statLabel: {
    fontSize: 7, fontWeight: 500, color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 3,
  },

  // ─── Progress bar ─────────────────────────────────────────────────────────
  progressWrap: {
    marginHorizontal: 16, marginBottom: 14,
    backgroundColor: C.borderLight, borderRadius: 99, height: 8,
    overflow: 'hidden',
  },
  progressBar: { height: 8, borderRadius: 99, backgroundColor: C.primary },
  progressLabel: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 6, marginBottom: 14,
  },
  progressText: { fontSize: 7.5, fontWeight: 600, color: C.textSub },
  progressPct: { fontSize: 7.5, fontWeight: 700, color: C.primary },

  // ─── Table ────────────────────────────────────────────────────────────────
  tableHead: {
    flexDirection: 'row', backgroundColor: C.primaryBg,
    paddingHorizontal: 14, paddingVertical: 9,
    borderBottomWidth: 1.5, borderColor: C.primaryMid,
  },
  thCell: {
    fontSize: 7.5, fontWeight: 700, color: C.primaryDark,
    textTransform: 'uppercase', letterSpacing: 0.7,
  },
  tableRow: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderColor: C.borderLight,
    alignItems: 'flex-start',
  },
  tableRowAlt: { backgroundColor: C.rowAlt },
  td: { fontSize: 8.5, color: C.text, fontWeight: 400 },
  tdMuted: { fontSize: 8, color: C.textMuted, marginTop: 1.5 },

  // col widths
  cDate:  { width: '9%' },
  cDay:   { width: '7%' },
  cIn:    { width: '8%' },
  cOut:   { width: '8%' },
  cDur:   { width: '9%' },
  cSt:    { width: '13%' },
  cAct:   { flex: 1 },

  badge: {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2.5,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 7, fontWeight: 600 },

  // ─── Total row ────────────────────────────────────────────────────────────
  totalRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: C.primaryBg,
    borderTopWidth: 1.5, borderColor: C.primaryMid,
    gap: 20,
  },
  totalLabel: { fontSize: 8, fontWeight: 600, color: C.textSub, textTransform: 'uppercase' },
  totalValue: { fontSize: 9, fontWeight: 700, color: C.primary },

  // ─── Signatures ───────────────────────────────────────────────────────────
  sigRow: { flexDirection: 'row', gap: 40, marginTop: 4 },
  sigBox: { flex: 1, alignItems: 'center', paddingTop: 8 },
  sigName: { fontSize: 9, fontWeight: 700, color: C.text, marginTop: 6 },
  sigRole: { fontSize: 7.5, color: C.textMuted, marginTop: 2, fontWeight: 400 },

  // ─── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 16, left: 36, right: 36,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderColor: C.border, paddingTop: 7,
  },
  footerText: { fontSize: 7, color: C.textLight, fontWeight: 400 },
  footerPage: { fontSize: 7, color: C.primary, fontWeight: 600 },

  // ─── Obs ──────────────────────────────────────────────────────────────────
  obsText: {
    fontSize: 8.5, color: C.textSub, lineHeight: 1.6, fontWeight: 400,
  },
})

// ── SVG: ícone relógio ───────────────────────────────────────────────────────
function ClockIcon({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="12" y1="12" x2="12" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="12" y1="12" x2="16" y2="14.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
    </Svg>
  )
}

function SectionIcon({ color = C.primaryDark }: { color?: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Rect x="0" y="0" width="10" height="10" rx="2" fill={color} opacity="0.15" />
      <Rect x="2" y="2" width="6" height="6" rx="1" fill={color} />
    </Svg>
  )
}

// ── Barra de progresso inline (SVG para precisão) ────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  const w = 496 // largura útil em pt (A4 com margens)
  const filled = Math.min(pct / 100, 1) * w
  return (
    <Svg width="100%" height="8" viewBox={`0 0 ${w} 8`}>
      <Rect x="0" y="0" width={w}      height="8" rx="4" fill={C.borderLight} />
      <Rect x="0" y="0" width={filled} height="8" rx="4" fill={C.primary} />
    </Svg>
  )
}

// ── Linha de assinatura ──────────────────────────────────────────────────────
function SigLine() {
  return (
    <Svg width="100%" height="1" viewBox="0 0 220 1">
      <Line x1="0" y1="0" x2="220" y2="0" stroke={C.border} strokeWidth="1" />
    </Svg>
  )
}

// ── Header (reutilizável em pg 2+) ───────────────────────────────────────────
function PageHeader({ fixed = false, institutionName = 'Controle de Ponto', period = '' }: {
  fixed?: boolean; institutionName?: string; period?: string
}) {
  const style = fixed ? s.headerBarFixed : s.headerBar
  return (
    <View style={style} fixed={fixed}>
      <View style={s.logoBox}>
        <ClockIcon size={22} color="#fff" />
      </View>
      <View style={s.headerMid}>
        <Text style={s.headerTitle}>Relatório de Frequência</Text>
        <Text style={s.headerSub}>{institutionName} · Sistema de Controle de Ponto</Text>
      </View>
      <View style={s.headerRight}>
        {period && <Text style={s.headerRightLine}>{period}</Text>}
        <Text style={s.headerRightLineMuted}>
          Emissão: {new Date().toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </View>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export function FrequenciaIndividual({
  studentName,
  course,
  period,
  records,
  totalHours,
  requiredHours  = '160h',
  pendingHours,
  totalSessions,
  approvedSessions,
  supervisorName  = 'Supervisor Responsável',
  institutionName = 'Controle de Ponto',
}: FrequenciaProps) {
  const periodLabel = `${period.start} a ${period.end}`

  // Calcula % de progresso
  const reqN = parseFloat(requiredHours.replace('h', '').replace(',', '.')) || 160
  const totN = parseFloat(totalHours.replace('h', '').replace(',', '.').replace('min', '')) || 0
  const pct  = Math.min(Math.round((totN / reqN) * 100), 100)

  const pendN = Math.max(reqN - totN, 0)
  const pendStr = pendingHours ?? `${pendN.toFixed(1).replace('.0', '')}h`

  const WEEKDAY: Record<number, string> = { 0:'Dom',1:'Seg',2:'Ter',3:'Qua',4:'Qui',5:'Sex',6:'Sáb' }
  function dayOfWeek(dateStr: string) {
    const parts = dateStr.split('/')
    if (parts.length < 2) return ''
    const d = new Date(`2026-${parts[1]}-${parts[0]}`)
    return isNaN(d.getTime()) ? '' : (WEEKDAY[d.getDay()] ?? '')
  }

  return (
    <Document
      title={`Frequência Individual — ${studentName}`}
      author={institutionName}
      language="pt-BR"
    >
      <Page size="A4" style={s.page}>

        {/* ══ HEADER ══ */}
        <PageHeader institutionName={institutionName} period={periodLabel} />

        {/* ══ INFORMAÇÕES DO ESTAGIÁRIO ══ */}
        <View style={s.card} wrap={false}>
          <View style={s.cardHeader}>
            <SectionIcon />
            <Text style={s.cardHeaderTitle}>Informações do Estagiário</Text>
          </View>
          <View style={s.infoGrid}>
            <View style={[s.infoCell, { flex: 2 }]}>
              <Text style={s.infoLabel}>Nome Completo</Text>
              <Text style={s.infoValue}>{studentName}</Text>
            </View>
            {course && (
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>Curso</Text>
                <Text style={s.infoValueSm}>{course}</Text>
              </View>
            )}
            <View style={s.infoCell}>
              <Text style={s.infoLabel}>Período Inicial</Text>
              <Text style={s.infoValueSm}>{period.start}</Text>
            </View>
            <View style={[s.infoCell, s.infoCellLast]}>
              <Text style={s.infoLabel}>Período Final</Text>
              <Text style={s.infoValueSm}>{period.end}</Text>
            </View>
          </View>
        </View>

        {/* ══ RESUMO DO PERÍODO ══ */}
        <View style={s.card} wrap={false}>
          <View style={s.cardHeader}>
            <SectionIcon />
            <Text style={s.cardHeaderTitle}>Resumo do Período</Text>
          </View>

          {/* Stats */}
          <View style={s.statsGrid}>
            {[
              { num: requiredHours, label: 'Horas Previstas',    color: C.textSub     },
              { num: totalHours,    label: 'Horas Realizadas',   color: C.primary     },
              { num: pendStr,       label: 'Horas Pendentes',    color: C.warning     },
              { num: String(totalSessions),    label: 'Dias Registrados',  color: C.text    },
              { num: String(approvedSessions), label: 'Sessões Aprovadas', color: C.success },
            ].map((st, i, arr) => (
              <View key={i} style={[s.statCell, i === arr.length - 1 ? s.statCellLast : {}]}>
                <Text style={[s.statNum, { color: st.color }]}>{st.num}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Progress */}
          <View style={{ marginHorizontal: 16, marginTop: 10 }}>
            <ProgressBar pct={pct} />
          </View>
          <View style={s.progressLabel}>
            <Text style={s.progressText}>{totalHours} de {requiredHours}</Text>
            <Text style={s.progressPct}>{pct}% concluído</Text>
          </View>
        </View>

        {/* ══ REGISTROS DE PONTO ══ */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <SectionIcon />
            <Text style={s.cardHeaderTitle}>Registros de Ponto</Text>
          </View>

          {/* Cabeçalho da tabela */}
          <View style={s.tableHead}>
            <Text style={[s.thCell, s.cDate]}>Data</Text>
            <Text style={[s.thCell, s.cDay]}>Dia</Text>
            <Text style={[s.thCell, s.cIn]}>Entrada</Text>
            <Text style={[s.thCell, s.cOut]}>Saída</Text>
            <Text style={[s.thCell, s.cDur]}>Total</Text>
            <Text style={[s.thCell, s.cSt]}>Status</Text>
            <Text style={[s.thCell, s.cAct]}>Atividade(s)</Text>
          </View>

          {/* Linhas */}
          {records.map((r, i) => {
            const cfg = STATUS[r.status] ?? STATUS.pending
            return (
              <View key={i} wrap={false}
                style={[s.tableRow, i % 2 !== 0 ? s.tableRowAlt : {}]}>
                <Text style={[s.td, s.cDate]}>{r.date}</Text>
                <Text style={[s.td, s.cDay, { color: C.textMuted }]}>{dayOfWeek(r.date)}</Text>
                <Text style={[s.td, s.cIn]}>{r.clockIn}</Text>
                <Text style={[s.td, s.cOut]}>{r.clockOut ?? '—'}</Text>
                <Text style={[s.td, s.cDur, { fontWeight: 600, color: C.textSub }]}>{r.duration}</Text>
                <View style={s.cSt}>
                  <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={s.cAct}>
                  {r.activities.length > 0
                    ? r.activities.map((a, ai) => (
                        <Text key={ai} style={[s.td, { marginBottom: ai < r.activities.length - 1 ? 2 : 0 }]}>
                          {r.activities.length > 1 ? `• ${a}` : a}
                        </Text>
                      ))
                    : <Text style={s.tdMuted}>—</Text>
                  }
                </View>
              </View>
            )
          })}

          {/* Totais */}
          <View style={s.totalRow}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Text style={s.totalLabel}>Total Registrado:</Text>
              <Text style={s.totalValue}>{totalHours}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Text style={s.totalLabel}>Horas Pendentes:</Text>
              <Text style={[s.totalValue, { color: pendN > 0 ? C.warning : C.success }]}>{pendStr}</Text>
            </View>
          </View>
        </View>

        {/* ══ OBSERVAÇÕES E VALIDAÇÃO ══ */}
        <View style={s.card} wrap={false}>
          <View style={s.cardHeader}>
            <SectionIcon />
            <Text style={s.cardHeaderTitle}>Observações e Validação</Text>
          </View>
          <View style={s.cardBody}>
            <Text style={s.obsText}>
              Este relatório foi gerado automaticamente pelo sistema {institutionName} com base
              nos registros de entrada e saída do estagiário no período indicado.
              Registros sem marcação de ponto devem ser verificados pelo supervisor responsável.
            </Text>

            {/* Assinaturas */}
            <View style={[s.sigRow, { marginTop: 28 }]}>
              <View style={s.sigBox}>
                <SigLine />
                <Text style={s.sigName}>{supervisorName}</Text>
                <Text style={s.sigRole}>Supervisor / Responsável</Text>
              </View>
              <View style={s.sigBox}>
                <SigLine />
                <Text style={s.sigName}>{studentName}</Text>
                <Text style={s.sigRole}>Estagiário(a)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══ FOOTER fixo ══ */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {institutionName} · Sistema de Controle de Ponto para Estagiários · Documento gerado automaticamente
          </Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
