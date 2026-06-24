import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Svg,
  Line, Rect, Circle,
} from '@react-pdf/renderer'

// ── Tipos ────────────────────────────────────────────────────────────────────
export type ActivityRecord = {
  date: string           // ex: "22/06/2026"
  clockIn: string        // ex: "08:00"
  clockOut: string | null
  duration: string       // ex: "4h 30min"
  status: 'approved' | 'pending' | 'rejected'
  activities: string[]
}

export type FrequenciaProps = {
  studentName: string
  period: { start: string; end: string }
  records: ActivityRecord[]
  totalHours: string
  totalSessions: number
  approvedSessions: number
}

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg:         '#0a1a0a',
  surface:    '#0d1f0d',
  card:       '#0f2318',
  cardAlt:    '#0a1a0a',
  border:     '#1a3a1a',
  primary:    '#3fe56c',
  primaryDim: '#1a5c30',
  text:       '#e8f5e9',
  textMuted:  '#6b9c6b',
  textDim:    '#4a7a4a',
  success:    '#3fe56c',
  warning:    '#f59e0b',
  danger:     '#ef4444',
  white:      '#ffffff',
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'APROVADO',
  pending:  'PENDENTE',
  rejected: 'REPROVADO',
}
const STATUS_COLOR: Record<string, string> = {
  approved: C.success,
  pending:  C.warning,
  rejected: C.danger,
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 52,
    fontFamily: 'Helvetica',
  },

  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 20, fontFamily: 'Helvetica-Bold',
    color: C.primary, letterSpacing: 2, textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 8, color: C.textMuted, letterSpacing: 1.5,
    textTransform: 'uppercase', marginTop: 3,
  },
  headerBadge: {
    backgroundColor: C.primaryDim, borderRadius: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.primary,
  },
  headerBadgeText: { fontSize: 8, color: C.primary, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },

  divider: { height: 1, backgroundColor: C.primaryDim, marginBottom: 16 },

  // Info card
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoCard: {
    flex: 1, backgroundColor: C.card,
    borderRadius: 6, padding: 12,
    borderWidth: 1, borderColor: C.border,
  },
  infoLabel: { fontSize: 7, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: 12, color: C.text, fontFamily: 'Helvetica-Bold' },
  infoValueSm: { fontSize: 10, color: C.text, fontFamily: 'Helvetica-Bold' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 6, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: C.border,
  },
  statNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.primary },
  statLabel: { fontSize: 7, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  // Table
  tableHeader: {
    flexDirection: 'row', backgroundColor: C.primaryDim,
    paddingVertical: 8, paddingHorizontal: 6,
    borderTopLeftRadius: 6, borderTopRightRadius: 6,
    borderWidth: 1, borderColor: C.border,
  },
  tableHeaderCell: {
    fontSize: 7, fontFamily: 'Helvetica-Bold',
    color: C.primary, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 6,
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: C.border, alignItems: 'flex-start',
  },
  cell: { fontSize: 8, color: C.text },
  cellMuted: { fontSize: 7, color: C.textMuted, marginTop: 2 },

  // Col widths
  colDate:       { width: '13%' },
  colIn:         { width: '9%' },
  colOut:        { width: '9%' },
  colDur:        { width: '12%' },
  colStatus:     { width: '13%' },
  colActivities: { flex: 1 },

  statusBadge: {
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 6, fontFamily: 'Helvetica-Bold' },

  // Footer
  footer: {
    position: 'absolute', bottom: 20, left: 32, right: 32,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerText: { fontSize: 7, color: C.textDim },
  footerAccent: { fontSize: 7, color: C.primary },

  // Section title
  sectionTitle: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
})

// ── Logo SVG ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <Svg width="36" height="36" viewBox="0 0 36 36">
      <Rect x="0" y="0" width="36" height="36" rx="8" fill={C.primaryDim} />
      <Rect x="1" y="1" width="34" height="34" rx="7" fill="none" stroke={C.primary} strokeWidth="1" />
      {/* Clock face */}
      <Circle cx="18" cy="18" r="10" fill="none" stroke={C.primary} strokeWidth="1.5" />
      <Line x1="18" y1="18" x2="18" y2="11" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="18" y1="18" x2="23" y2="21" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="18" cy="18" r="1.5" fill={C.primary} />
    </Svg>
  )
}

// ── Separador visual ─────────────────────────────────────────────────────────
function AccentLine() {
  return (
    <Svg width="100%" height="3" viewBox="0 0 500 3">
      <Rect x="0" y="0" width="80" height="3" fill={C.primary} />
      <Rect x="84" y="0" width="30" height="3" fill={C.primaryDim} />
      <Rect x="118" y="0" width="10" height="3" fill={C.border} />
    </Svg>
  )
}

// ── Componente Principal ─────────────────────────────────────────────────────
export function FrequenciaIndividual({
  studentName,
  period,
  records,
  totalHours,
  totalSessions,
  approvedSessions,
}: FrequenciaProps) {
  const geradoEm = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <Document
      title={`Frequência Individual — ${studentName}`}
      author="Sistema Controle de Ponto"
      subject="Relatório de Frequência Individual"
      language="pt-BR"
    >
      <Page size="A4" orientation="landscape" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.headerRow}>
          <LogoMark />
          <View style={[s.headerLeft, { marginLeft: 12 }]}>
            <Text style={s.headerTitle}>Controle de Ponto</Text>
            <Text style={s.headerSub}>Relatório de Frequência Individual</Text>
          </View>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>DOCUMENTO OFICIAL</Text>
          </View>
        </View>

        <AccentLine />
        <View style={{ marginBottom: 16 }} />

        {/* ── INFO CARDS ── */}
        <View style={s.infoRow}>
          <View style={[s.infoCard, { flex: 2 }]}>
            <Text style={s.infoLabel}>Estagiário</Text>
            <Text style={s.infoValue}>{studentName}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Período Inicial</Text>
            <Text style={s.infoValueSm}>{period.start}</Text>
          </View>
          <View style={s.infoCard}>
            <Text style={s.infoLabel}>Período Final</Text>
            <Text style={s.infoValueSm}>{period.end}</Text>
          </View>
        </View>

        {/* ── STATS ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalHours}</Text>
            <Text style={s.statLabel}>Total de Horas</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalSessions}</Text>
            <Text style={s.statLabel}>Sessões Registradas</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{approvedSessions}</Text>
            <Text style={s.statLabel}>Sessões Aprovadas</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: totalSessions > 0 ? C.primary : C.textMuted }]}>
              {totalSessions > 0 ? `${Math.round((approvedSessions / totalSessions) * 100)}%` : '—'}
            </Text>
            <Text style={s.statLabel}>Taxa de Aprovação</Text>
          </View>
        </View>

        {/* ── TABELA ── */}
        <Text style={s.sectionTitle}>Registros do Período</Text>

        {/* Cabeçalho */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderCell, s.colDate]}>Data</Text>
          <Text style={[s.tableHeaderCell, s.colIn]}>Entrada</Text>
          <Text style={[s.tableHeaderCell, s.colOut]}>Saída</Text>
          <Text style={[s.tableHeaderCell, s.colDur]}>Duração</Text>
          <Text style={[s.tableHeaderCell, s.colStatus]}>Status</Text>
          <Text style={[s.tableHeaderCell, s.colActivities]}>Atividades</Text>
        </View>

        {/* Linhas */}
        {records.map((r, i) => {
          const bgRow = i % 2 === 0 ? C.card : C.cardAlt
          const statusColor = STATUS_COLOR[r.status] ?? C.textMuted
          return (
            <View key={i} wrap={false} style={[s.tableRow, { backgroundColor: bgRow }]}>
              <Text style={[s.cell, s.colDate]}>{r.date}</Text>
              <Text style={[s.cell, s.colIn]}>{r.clockIn}</Text>
              <Text style={[s.cell, s.colOut]}>{r.clockOut ?? '—'}</Text>
              <Text style={[s.cell, s.colDur]}>{r.duration}</Text>
              <View style={s.colStatus}>
                <View style={[s.statusBadge, { backgroundColor: `${statusColor}20`, borderWidth: 1, borderColor: `${statusColor}50` }]}>
                  <Text style={[s.statusText, { color: statusColor }]}>
                    {STATUS_LABEL[r.status] ?? r.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={s.colActivities}>
                {r.activities.length > 0 ? (
                  r.activities.map((a, ai) => (
                    <Text key={ai} style={[s.cell, { marginBottom: ai < r.activities.length - 1 ? 2 : 0 }]}>
                      {'• '}{a}
                    </Text>
                  ))
                ) : (
                  <Text style={s.cellMuted}>Nenhuma atividade registrada</Text>
                )}
              </View>
            </View>
          )
        })}

        {records.length === 0 && (
          <View style={[s.tableRow, { backgroundColor: C.card, justifyContent: 'center', paddingVertical: 24 }]}>
            <Text style={[s.cell, { color: C.textMuted, textAlign: 'center' }]}>
              Nenhum registro encontrado para o período selecionado.
            </Text>
          </View>
        )}

        {/* ── FOOTER (fixo em todas as páginas) ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Gerado em {geradoEm} · Sistema Controle de Ponto
          </Text>
          <Text
            style={s.footerAccent}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
