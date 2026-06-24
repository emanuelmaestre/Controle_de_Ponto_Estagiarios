import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  C, M, HEADER_H, shared,
  PageHeader, PageFooter, ProgressBar, SigLine, compactH, dowFromBr,
} from './pdfShared'

// ── Tipos ────────────────────────────────────────────────────────────────────
export type ActivityRecord = {
  date:       string
  clockIn:    string
  clockOut:   string | null
  duration:   string
  status:     'approved' | 'pending' | 'rejected'
  activities: string[]
}

export type FrequenciaProps = {
  studentName:      string
  course?:          string
  semester?:        string
  internshipStart?: string
  period:           { start: string; end: string }
  records:          ActivityRecord[]
  totalHours:       string
  requiredHours?:   string
  excessHours?:     string
  pendingHours?:    string
  totalSessions:    number
  approvedSessions: number
  inconsistencies?: number
  supervisorName?:  string
  institutionName?: string
  periodLabel?:     string
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.pageBg,
    fontFamily:      'Poppins',
    paddingTop:      HEADER_H + 6,
    paddingHorizontal: M,
    paddingBottom:   36,
    fontSize:        9,
    color:           C.text,
  },

  // Info grid
  infoGrid:    { borderWidth: 1, borderColor: C.borderCard, marginBottom: 10 },
  infoRow:     { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.borderCard },
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
  infoValue: { fontSize: 11, fontWeight: 600, color: C.text, textTransform: 'uppercase' },

  // Cards (6, fiel ao reference)
  cardsWrap: {
    flexDirection: 'row',
    borderWidth: 1, borderColor: C.borderCard,
    marginBottom: 0,
  },
  card:     { flex: 1, alignItems: 'center', borderRightWidth: 1, borderColor: C.borderCard, paddingBottom: 10 },
  cardLast: { borderRightWidth: 0 },
  cardAccent: { height: 3, alignSelf: 'stretch', marginBottom: 8 },
  cardNum:    { fontSize: 18, fontWeight: 700, lineHeight: 1.1 },
  cardLabel:  {
    fontSize: 6, fontWeight: 400, color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.4,
    textAlign: 'center', marginTop: 3, paddingHorizontal: 2,
  },

  // Colunas tabela
  cDate: { width: '10%' },
  cDay:  { width: '9%' },
  cTime: { width: '22%' },
  cDur:  { width: '10%' },
  cAct:  { flex: 1 },

  // Assinaturas
  sigWrap: { flexDirection: 'row', gap: 24, paddingHorizontal: 10, paddingTop: 24, paddingBottom: 16 },
  sigBox:  { flex: 1, alignItems: 'center' },
  sigName: { fontSize: 9, fontWeight: 700, color: C.text, marginTop: 5 },
  sigRole: { fontSize: 7.5, color: C.textMuted, marginTop: 2 },
  obsText: { fontSize: 8.5, color: C.textSub, lineHeight: 1.65, padding: 12 },
})

// ── Componente ───────────────────────────────────────────────────────────────
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
  const reqN  = parseFloat(requiredHours.replace(/[^\d.]/g, '')) || 160
  const totN  = parseFloat(totalHours.replace(/[^\d.]/g, ''))   || 0
  const pct   = Math.min(100, Math.round((totN / reqN) * 100))
  const pendN = Math.max(reqN - totN, 0)
  const pendH = Math.floor(pendN)
  const pendM = Math.round((pendN % 1) * 60)
  const pendStr = pendingHours ?? (pendN === 0 ? '0h' : `${pendH}h${pendM > 0 ? `${pendM}min` : ''}`)

  const pLabel   = periodLabel ?? `${period.start} a ${period.end}`
  const barLabel = `${pct}% · ${totalHours} de ${requiredHours}`

  const CARDS = [
    { num: requiredHours,         label: 'Horas Previstas',  color: C.gray   },
    { num: compactH(totalHours),  label: 'Horas Realizadas', color: C.green  },
    { num: compactH(pendStr),     label: 'Horas Pendentes',  color: C.red    },
    { num: compactH(excessHours), label: 'Horas Excedentes', color: C.yellow },
    { num: `${totalSessions}`,    label: 'Dias Registrados', color: C.blue   },
    { num: `${inconsistencies}`,  label: 'Inconsistências',  color: C.orange },
  ]

  return (
    <Document title={`Frequência Individual — ${studentName}`} author={institutionName} language="pt-BR">
      <Page size="A4" style={s.page}>

        {/* HEADER fixo — repete em todas as páginas */}
        <PageHeader
          title="RELATÓRIO DE FREQUÊNCIA"
          institutionName={institutionName}
          supervisorName={supervisorName || undefined}
          periodLabel={pLabel}
        />

        {/* INFORMAÇÕES DO ESTAGIÁRIO */}
        <View style={shared.secBar}>
          <Text style={shared.secBarText}>INFORMAÇÕES DO ESTAGIÁRIO</Text>
        </View>
        <View style={s.infoGrid}>
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

        {/* RESUMO DO PERÍODO */}
        <View style={shared.secBar}>
          <Text style={shared.secBarText}>RESUMO DO PERÍODO</Text>
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
        <ProgressBar pct={pct} label={barLabel} />

        {/* REGISTROS DE PONTO */}
        <View style={shared.secBar}>
          <Text style={shared.secBarText}>REGISTROS DE PONTO</Text>
        </View>
        <View style={shared.tableWrap}>
          <View style={shared.tableHead}>
            <Text style={[shared.thCell, s.cDate]}>Data</Text>
            <Text style={[shared.thCell, s.cDay]}>Dia</Text>
            <Text style={[shared.thCell, s.cTime]}>Entrada / Saída</Text>
            <Text style={[shared.thCell, s.cDur]}>Total</Text>
            <Text style={[shared.thCell, s.cAct]}>Atividade</Text>
          </View>
          {records.map((r, i) => (
            <View key={i} wrap={false}
              style={[shared.tableRow, i % 2 !== 0 ? { backgroundColor: C.rowAlt } : {}]}>
              <Text style={[shared.td, s.cDate]}>{r.date.length > 5 ? r.date.slice(0, 5) : r.date}</Text>
              <Text style={[shared.tdSub, s.cDay, { textTransform: 'uppercase' }]}>{dowFromBr(r.date)}</Text>
              <View style={s.cTime}>
                <Text style={shared.td}>
                  {r.clockIn && r.clockIn !== '—'
                    ? r.clockOut ? `${r.clockIn} - ${r.clockOut}` : r.clockIn
                    : '—'}
                </Text>
              </View>
              <Text style={[shared.td, s.cDur, { fontWeight: 600 }]}>{r.duration}</Text>
              <View style={s.cAct}>
                {r.activities.length > 0
                  ? r.activities.map((a, ai) => (
                      <Text key={ai} style={[shared.td, { marginBottom: ai < r.activities.length - 1 ? 2 : 0 }]}>{a}</Text>
                    ))
                  : <Text style={shared.tdMuted}>—</Text>}
              </View>
            </View>
          ))}
          <View style={shared.totalsBox}>
            <View style={shared.totalLine}>
              <Text style={shared.totalLabel}>TOTAL REGISTRADO:</Text>
              <Text style={shared.totalValue}>{totalHours}</Text>
            </View>
            <View style={shared.totalLineLast}>
              <Text style={shared.totalLabel}>HORAS PENDENTES:</Text>
              <Text style={[shared.totalValue, { color: pendN > 0 ? C.red : C.green }]}>{pendStr}</Text>
            </View>
          </View>
        </View>

        {/* OBSERVAÇÕES E VALIDAÇÃO */}
        <View style={shared.secBar} wrap={false}>
          <Text style={shared.secBarText}>OBSERVAÇÕES E VALIDAÇÃO</Text>
        </View>
        <View wrap={false} style={{ borderWidth: 1, borderTopWidth: 0, borderColor: C.borderCard }}>
          <Text style={s.obsText}>
            Este relatório foi gerado automaticamente pelo sistema {institutionName} com base nos
            registros de entrada e saída do estagiário no período indicado. Registros sem marcação
            de ponto devem ser verificados pelo supervisor responsável.
          </Text>
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

        {/* FOOTER fixo */}
        <PageFooter institutionName={institutionName} />

      </Page>
    </Document>
  )
}
