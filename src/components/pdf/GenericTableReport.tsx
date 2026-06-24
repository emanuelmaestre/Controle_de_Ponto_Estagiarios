import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import path from 'path'

const FONT_DIR = path.join(process.cwd(), 'src/components/pdf/fonts')
Font.register({
  family: 'Poppins',
  fonts: [
    { src: `${FONT_DIR}/Poppins-Regular.ttf`,  fontWeight: 400 },
    { src: `${FONT_DIR}/Poppins-SemiBold.ttf`, fontWeight: 600 },
    { src: `${FONT_DIR}/Poppins-Bold.ttf`,     fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback(w => [w])

const C = {
  green:      '#1a9c45',
  greenLight: '#eaf7ee',
  secBar:     '#122216',
  secText:    '#3fe56c',
  text:       '#111827',
  textSub:    '#374151',
  textMuted:  '#9ca3af',
  border:     '#e5e7eb',
  rowAlt:     '#f4f8f4',
  red:        '#c0392b',
  footerBg:   '#eef4ee',
  white:      '#ffffff',
}

const M = 14

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: 'Poppins',
    paddingHorizontal: M,
    paddingBottom: 36,
    paddingTop: 0,
    fontSize: 9,
    color: C.text,
  },
  topStrip: { height: 3, backgroundColor: C.green, marginHorizontal: -M },
  header: {
    paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderColor: C.border,
    marginBottom: 10,
  },
  title:    { fontSize: 16, fontWeight: 700, color: C.text },
  subtitle: { fontSize: 9, color: C.textMuted, marginTop: 3 },
  meta:     { fontSize: 8, color: C.textSub, marginTop: 2 },

  secBar: {
    backgroundColor: C.secBar,
    marginHorizontal: -M,
    paddingHorizontal: M,
    paddingVertical: 6,
    marginBottom: 0,
  },
  secBarText: { fontSize: 8.5, fontWeight: 700, color: C.secText, letterSpacing: 0.8 },

  cardsWrap: { flexDirection: 'row', marginBottom: 10, gap: 6 },
  card: {
    flex: 1, padding: 10,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 6,
  },
  cardNum:   { fontSize: 16, fontWeight: 700, color: C.green },
  cardLabel: { fontSize: 6.5, color: C.textMuted, textTransform: 'uppercase', marginTop: 3 },

  tableWrap: { borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.secBar,
    paddingVertical: 7, paddingHorizontal: 6,
  },
  thCell: { fontSize: 8, fontWeight: 700, color: C.secText, letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6,
    borderTopWidth: 1, borderColor: C.border,
  },
  td: { fontSize: 8.5, color: C.text },

  totalsBox: {
    backgroundColor: C.greenLight,
    borderWidth: 1, borderColor: '#c6ecd2',
    padding: 10, marginBottom: 10,
  },
  totalLine: { flexDirection: 'row', marginBottom: 4 },
  totalLabel: { fontSize: 9, fontWeight: 700, color: C.textSub, width: 140 },
  totalValue: { fontSize: 9, fontWeight: 700, color: C.green },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.footerBg,
    borderTopWidth: 1, borderColor: C.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: M, paddingVertical: 5,
  },
  footerLeft:  { fontSize: 6.5, color: C.textMuted },
  footerRight: { fontSize: 8,   fontWeight: 700, color: C.red },
})

export type GenericColumn = { header: string; dataKey: string; width?: number }
export type SummaryCard   = { label: string; value: string }
export type TotalLine     = { label: string; value: string }

export type GenericTableReportProps = {
  title:         string
  tableTitle?:   string
  period:        string
  institutionName: string
  supervisorName?: string
  internName?:   string
  summaryCards?: SummaryCard[]
  columns:       GenericColumn[]
  rows:          Record<string, string | number>[]
  totals?:       TotalLine[]
}

export function GenericTableReport({
  title,
  tableTitle,
  period,
  institutionName,
  supervisorName,
  internName,
  summaryCards,
  columns,
  rows,
  totals,
}: GenericTableReportProps) {
  const today = new Date().toLocaleDateString('pt-BR')

  return (
    <Document title={title} author={institutionName} language="pt-BR">
      <Page size="A4" style={s.page}>

        {/* Faixa verde topo */}
        <View style={s.topStrip} />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{institutionName}</Text>
          {supervisorName ? <Text style={s.meta}>{supervisorName}</Text> : null}
          <Text style={s.meta}>Período: {period}</Text>
          {internName     ? <Text style={s.meta}>Estagiário: {internName}</Text> : null}
          <Text style={s.meta}>Emissão: {today}</Text>
        </View>

        {/* Cards de resumo */}
        {summaryCards && summaryCards.length > 0 && (
          <>
            <View style={s.secBar}>
              <Text style={s.secBarText}>RESUMO</Text>
            </View>
            <View style={[s.cardsWrap, { marginTop: 8 }]}>
              {summaryCards.map((c, i) => (
                <View key={i} style={s.card}>
                  <Text style={s.cardNum}>{c.value}</Text>
                  <Text style={s.cardLabel}>{c.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Tabela */}
        <View style={s.secBar}>
          <Text style={s.secBarText}>{tableTitle ?? 'DADOS'}</Text>
        </View>
        <View style={s.tableWrap}>
          {/* Cabeçalho */}
          <View style={s.tableHead}>
            {columns.map((col, i) => (
              <Text
                key={i}
                style={[s.thCell, col.width ? { width: col.width } : { flex: 1 }]}
              >
                {col.header}
              </Text>
            ))}
          </View>

          {/* Linhas */}
          {rows.map((row, ri) => (
            <View key={ri} wrap={false}
              style={[s.tableRow, ri % 2 !== 0 ? { backgroundColor: C.rowAlt } : {}]}>
              {columns.map((col, ci) => (
                <Text
                  key={ci}
                  style={[s.td, col.width ? { width: col.width } : { flex: 1 }]}
                >
                  {String(row[col.dataKey] ?? '—')}
                </Text>
              ))}
            </View>
          ))}

          {/* Totais */}
          {totals && totals.length > 0 && (
            <View style={[s.totalsBox, { margin: 0, borderWidth: 0, borderTopWidth: 1, borderRadius: 0 }]}>
              {totals.map((t, i) => (
                <View key={i} style={i < totals.length - 1 ? s.totalLine : { flexDirection: 'row' }}>
                  <Text style={s.totalLabel}>{t.label}:</Text>
                  <Text style={s.totalValue}>{t.value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            {institutionName} · Sistema de Controle de Ponto · Documento gerado automaticamente
          </Text>
          <Text
            style={s.footerRight}
            render={({ pageNumber }) => `Página ${pageNumber}`}
          />
        </View>

      </Page>
    </Document>
  )
}
