import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import {
  C, M, HEADER_H, shared,
  PageHeader, PageFooter, ProgressBar, SigLine, compactH,
} from './pdfShared'

export type GenericColumn = { header: string; dataKey: string; width?: number }
export type SummaryCard   = { label: string; value: string; colorKey?: string }
export type TotalLine     = { label: string; value: string }

export type InternInfo = {
  nome:       string
  curso?:     string
  dataInicio?: string
  titulo?:    string
}

export type GenericTableReportProps = {
  title:           string
  tableTitle?:     string
  period:          string
  institutionName: string
  supervisorName?: string
  internName?:     string
  internInfo?:     InternInfo
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
  obsText: { fontSize: 8.5, color: C.textSub, lineHeight: 1.65, padding: 12 },
  sigWrap: { flexDirection: 'row', gap: 24, paddingHorizontal: 10, paddingTop: 24, paddingBottom: 16 },
  sigBox:  { flex: 1, alignItems: 'center' },
  sigName: { fontSize: 9, fontWeight: 700, color: C.text, marginTop: 5 },
  sigRole: { fontSize: 7.5, color: C.textSub, marginTop: 2 },
})

// Estilos do grid de info (igual ao FrequenciaIndividual)
const ig = StyleSheet.create({
  grid:         { borderWidth: 1, borderColor: C.borderCard, marginBottom: 10 },
  row:          { flexDirection: 'row', borderBottomWidth: 1, borderColor: C.borderCard },
  rowLast:      { flexDirection: 'row' },
  cell:         { flex: 1, paddingHorizontal: 10, paddingVertical: 9, borderRightWidth: 1, borderColor: C.borderCard },
  cellLast:     { borderRightWidth: 0 },
  label:        { fontSize: 6, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 },
  value:        { fontSize: 11, fontWeight: 600, color: C.text, textTransform: 'uppercase' },
})

export function GenericTableReport({
  title,
  tableTitle,
  period,
  institutionName,
  supervisorName,
  internName,
  internInfo,
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
          institutionName={institutionName}
          supervisorName={supervisorName}
          periodLabel={period}
        />

        {/* INFORMAÇÕES DO ESTAGIÁRIO */}
        {internInfo && (
          <>
            <View style={shared.secBar}>
              <Text style={shared.secBarText}>INFORMAÇÕES DO ESTAGIÁRIO</Text>
            </View>
            <View style={ig.grid}>
              <View style={ig.row}>
                <View style={[ig.cell, { flex: 2 }]}>
                  <Text style={ig.label}>NOME{'\n'}COMPLETO</Text>
                  <Text style={ig.value}>{internInfo.nome}</Text>
                </View>
                <View style={[ig.cell, ig.cellLast]}>
                  <Text style={ig.label}>DATA DE INÍCIO</Text>
                  <Text style={ig.value}>{internInfo.dataInicio ?? '—'}</Text>
                </View>
              </View>
              <View style={ig.rowLast}>
                <View style={[ig.cell, { flex: 2 }]}>
                  <Text style={ig.label}>CURSO</Text>
                  <Text style={ig.value}>{internInfo.curso ?? '—'}</Text>
                </View>
                <View style={[ig.cell, ig.cellLast]}>
                  <Text style={ig.label}>TÍTULO</Text>
                  <Text style={ig.value}>{internInfo.titulo ?? '—'}</Text>
                </View>
              </View>
            </View>
          </>
        )}

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

        {/* OBSERVAÇÕES E VALIDAÇÃO */}
        <View wrap={false}>
          <View style={shared.secBar}>
            <Text style={shared.secBarText}>OBSERVAÇÕES E VALIDAÇÃO</Text>
          </View>
          <View style={{ borderWidth: 1, borderTopWidth: 0, borderColor: C.borderCard }}>
            <Text style={s.obsText}>
              Este relatório foi gerado automaticamente pelo sistema {institutionName} com base nos
              registros do período indicado. As informações contidas neste documento são de caráter
              oficial e devem ser assinadas pelo responsável e pelo estagiário para fins de comprovação.
            </Text>
            <View style={s.sigWrap}>
              <View style={s.sigBox}>
                <SigLine />
                <Text style={s.sigName}>{supervisorName || 'Supervisor / Responsável'}</Text>
                <Text style={s.sigRole}>Supervisor(a) / Responsável</Text>
              </View>
              {internInfo && (
                <View style={s.sigBox}>
                  <SigLine />
                  <Text style={s.sigName}>{internInfo.nome}</Text>
                  <Text style={s.sigRole}>Estagiário(a)</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* FOOTER fixo */}
        <PageFooter institutionName={institutionName} />

      </Page>
    </Document>
  )
}
