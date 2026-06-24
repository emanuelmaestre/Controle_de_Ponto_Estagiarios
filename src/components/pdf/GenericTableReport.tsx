import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  C, M, HEADER_H, shared,
  PageHeader, PageFooter, ProgressBar, compactH,
} from './pdfShared'

export type GenericColumn = { header: string; dataKey: string; width?: number }
export type SummaryCard   = { label: string; value: string; colorKey?: string }
export type TotalLine     = { label: string; value: string }

export type GenericTableReportProps = {
  title:           string
  tableTitle?:     string
  period:          string
  institutionName: string
  supervisorName?: string
  internName?:     string
  summaryCards?:   SummaryCard[]
  progressBar?:    { pct: number; label: string }
  columns:         GenericColumn[]
  rows:            Record<string, string | number>[]
  totals?:         TotalLine[]
}

// Cores por colorKey (alinhado com o catálogo de relatórios)
const KEY_COLOR: Record<string, string> = {
  green:  C.green,
  teal:   '#0d9488',
  blue:   C.blue,
  red:    C.red,
  orange: C.orange,
  yellow: C.yellow,
  gray:   C.gray,
}
function cardColor(key?: string) { return KEY_COLOR[key ?? 'green'] ?? C.green }

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
  cardsWrap: {
    flexDirection:  'row',
    borderWidth:    1, borderColor: C.borderCard,
    marginBottom:   0,
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
})

export function GenericTableReport({
  title,
  tableTitle,
  period,
  institutionName,
  supervisorName,
  internName,
  summaryCards,
  progressBar,
  columns,
  rows,
  totals,
}: GenericTableReportProps) {
  return (
    <Document title={title} author={institutionName} language="pt-BR">
      <Page size="A4" style={s.page}>

        {/* HEADER fixo */}
        <PageHeader
          title={title}
          subtitle={internName ? `Estagiário: ${internName}` : undefined}
          institutionName={institutionName}
          supervisorName={supervisorName}
          periodLabel={period}
        />

        {/* RESUMO */}
        {summaryCards && summaryCards.length > 0 && (
          <>
            <View style={shared.secBar}>
              <Text style={shared.secBarText}>RESUMO DO PERÍODO</Text>
            </View>
            <View style={s.cardsWrap}>
              {summaryCards.map((c, i) => {
                const col = cardColor(c.colorKey)
                return (
                  <View key={i} style={[s.card, i === summaryCards.length - 1 ? s.cardLast : {}]}>
                    <View style={[s.cardAccent, { backgroundColor: col }]} />
                    <Text style={[s.cardNum, { color: col }]}>{compactH(c.value)}</Text>
                    <Text style={s.cardLabel}>{c.label}</Text>
                  </View>
                )
              })}
            </View>
            {progressBar && (
              <ProgressBar pct={progressBar.pct} label={progressBar.label} />
            )}
            {!progressBar && <View style={{ height: 10 }} />}
          </>
        )}

        {/* TABELA */}
        <View style={shared.secBar}>
          <Text style={shared.secBarText}>{tableTitle ?? 'DADOS'}</Text>
        </View>
        <View style={shared.tableWrap}>
          {/* Cabeçalho */}
          <View style={shared.tableHead}>
            {columns.map((col, i) => (
              <Text
                key={i}
                style={[shared.thCell, col.width ? { width: col.width } : { flex: 1 }]}
              >
                {col.header}
              </Text>
            ))}
          </View>

          {/* Linhas */}
          {rows.length === 0 && (
            <View style={[shared.tableRow, { justifyContent: 'center' }]}>
              <Text style={shared.tdMuted}>Nenhum registro encontrado no período.</Text>
            </View>
          )}
          {rows.map((row, ri) => (
            <View key={ri} wrap={false}
              style={[shared.tableRow, ri % 2 !== 0 ? { backgroundColor: C.rowAlt } : {}]}>
              {columns.map((col, ci) => (
                <Text
                  key={ci}
                  style={[shared.td, col.width ? { width: col.width } : { flex: 1 }]}
                >
                  {String(row[col.dataKey] ?? '—')}
                </Text>
              ))}
            </View>
          ))}

          {/* Totais */}
          {totals && totals.length > 0 && (
            <View style={shared.totalsBox}>
              {totals.map((t, i) => (
                <View key={i} style={i < totals.length - 1 ? shared.totalLine : shared.totalLineLast}>
                  <Text style={shared.totalLabel}>{t.label}:</Text>
                  <Text style={shared.totalValue}>{t.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* FOOTER fixo */}
        <PageFooter institutionName={institutionName} />

      </Page>
    </Document>
  )
}
