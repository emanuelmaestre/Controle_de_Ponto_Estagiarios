import React from 'react'
import { Font, View, Text, Svg, Rect, Circle, Line, StyleSheet } from '@react-pdf/renderer'
import path from 'path'

// ── Fontes (registrado UMA VEZ aqui) ────────────────────────────────────────
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
export const C = {
  white:      '#ffffff',
  pageBg:     '#ffffff',
  secBar:     '#122216',
  secText:    '#3fe56c',
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
  footerBg:   '#eef4ee',
}

export const M = 14  // margem horizontal da página

// ── Estilos compartilhados ────────────────────────────────────────────────────
export const shared = StyleSheet.create({
  topStrip: {
    height: 3, backgroundColor: C.green,
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  headerWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 7, paddingBottom: 8, paddingHorizontal: M,
    borderBottomWidth: 1, borderColor: C.borderCard,
  },
  logoBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  titleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: 0.3 },
  headerSub:   { fontSize: 7.5, color: C.textMuted, marginTop: 2 },
  rightBox: { width: 105, alignItems: 'flex-end' },
  rightLab:    { fontSize: 8.5, fontWeight: 700, color: C.text },
  rightSup:    { fontSize: 7.5, color: C.textSub, marginTop: 2 },
  rightPeriod: { fontSize: 7.5, color: C.green,   marginTop: 2 },
  rightEmit:   { fontSize: 7.5, color: C.textMuted, marginTop: 2 },

  secBar: {
    backgroundColor: C.secBar,
    marginHorizontal: -M,
    paddingHorizontal: M,
    paddingVertical: 6,
  },
  secBarText: { fontSize: 8.5, fontWeight: 700, color: C.secText, letterSpacing: 0.8 },

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
  td:      { fontSize: 8.5, color: C.text },
  tdSub:   { fontSize: 8,   color: C.textSub },
  tdMuted: { fontSize: 8,   color: C.textMuted },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.footerBg,
    borderTopWidth: 1, borderColor: C.borderCard,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: M, paddingVertical: 5,
  },
  footerLeft:  { fontSize: 6.5, color: C.textMuted },
  footerRight: { fontSize: 8,   fontWeight: 700, color: C.red },

  totalsBox: {
    backgroundColor: C.greenLight,
    borderTopWidth: 1, borderColor: C.greenMid,
    padding: 12,
  },
  totalLine: { flexDirection: 'row', marginBottom: 5 },
  totalLineLast: { flexDirection: 'row' },
  totalLabel: { fontSize: 9, fontWeight: 700, color: C.textSub, width: 130 },
  totalValue: { fontSize: 9, fontWeight: 700, color: C.green },
})

// ── Logo SVG ──────────────────────────────────────────────────────────────────
export function Logo() {
  const r = 11, cx = 13, cy = 13
  return (
    <Svg width="36" height="36" viewBox="0 0 36 36">
      <Rect x="1" y="1" width="34" height="34" rx="7" fill={C.greenLight} stroke={C.green} strokeWidth="0.8" />
      <Circle cx={cx} cy={cy} r={r} fill={C.white} stroke={C.green} strokeWidth="1.2" />
      <Line x1={cx} y1={cy} x2={cx} y2={cy - 7} stroke={C.green}   strokeWidth="1.4" strokeLinecap="round" />
      <Line x1={cx} y1={cy} x2={cx + 5} y2={cy + 2} stroke={C.red} strokeWidth="1.6" strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r="1.5" fill={C.green} />
      <Line x1={cx} y1={cy - r + 1}   x2={cx}       y2={cy - r + 3}   stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx + r - 1} y1={cy}   x2={cx + r - 3} y2={cy}         stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx} y1={cy + r - 1}   x2={cx}       y2={cy + r - 3}   stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx - r + 1} y1={cy}   x2={cx - r + 3} y2={cy}         stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx - 3} y1={cy - r - 0.5} x2={cx + 3} y2={cy - r - 0.5} stroke={C.green} strokeWidth="0.8" />
      <Line x1={cx}     y1={cy - r - 0.5} x2={cx}     y2={cy - r - 2.5} stroke={C.green} strokeWidth="0.8" />
    </Svg>
  )
}

// ── Header fixo (repete em todas as páginas) ──────────────────────────────────
export const HEADER_H = 68  // altura total do header em pt

export function PageHeader({
  title, subtitle, institutionName, supervisorName, periodLabel,
}: {
  title: string; subtitle?: string
  institutionName: string; supervisorName?: string; periodLabel?: string
}) {
  const today = new Date().toLocaleDateString('pt-BR')
  return (
    <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: C.white }}>
      <View style={shared.topStrip} />
      <View style={[shared.headerWrap, { marginTop: 3 }]}>
        <View style={shared.logoBox}><Logo /></View>
        <View style={shared.titleBox}>
          <Text style={shared.headerTitle}>{title}</Text>
          {subtitle ? <Text style={shared.headerSub}>{subtitle}</Text> : null}
        </View>
        <View style={shared.rightBox}>
          <Text style={shared.rightLab}>{institutionName}</Text>
          {supervisorName ? <Text style={shared.rightSup}>{supervisorName}</Text> : null}
          {periodLabel    ? <Text style={shared.rightPeriod}>Período: {periodLabel}</Text> : null}
          <Text style={shared.rightEmit}>Emissão: {today}</Text>
        </View>
      </View>
    </View>
  )
}

// ── Footer fixo ───────────────────────────────────────────────────────────────
export function PageFooter({ institutionName }: { institutionName: string }) {
  return (
    <View style={shared.footer} fixed>
      <Text style={shared.footerLeft}>
        {institutionName} · Sistema de Controle de Ponto para Estagiários · Documento gerado automaticamente
      </Text>
      <Text
        style={shared.footerRight}
        render={({ pageNumber }) => `Página ${pageNumber}`}
      />
    </View>
  )
}

// ── Linha de assinatura ───────────────────────────────────────────────────────
export function SigLine() {
  return (
    <Svg width="180" height="1" viewBox="0 0 180 1">
      <Line x1="0" y1="0" x2="180" y2="0" stroke={C.borderCard} strokeWidth="1" />
    </Svg>
  )
}

// ── Barra de progresso (View puro, sem SVG text) ─────────────────────────────
export function ProgressBar({ pct, label }: { pct: number; label: string }) {
  const filled = Math.max(2, Math.min(100, pct))
  return (
    <View style={{ height: 22, position: 'relative', marginBottom: 10 }}>
      {/* Fundo */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: C.greenMid,
      }} />
      {/* Preenchimento */}
      <View style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${filled}%`,
        backgroundColor: C.green,
      }} />
      {/* Texto centralizado */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 9, fontWeight: 700, color: C.white, letterSpacing: 0.3 }}>
          {label}
        </Text>
      </View>
    </View>
  )
}

// ── Formata horas compacto para cards ("5h 44min" → "5h44") ─────────────────
export function compactH(h: string): string {
  return h.replace(/\s+(\d+)min/, '$1')
}

// ── Dia da semana ─────────────────────────────────────────────────────────────
const WEEKDAY: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
}
export function dowFromBr(dateStr: string): string {
  const [d, m, y] = dateStr.split('/')
  if (!d || !m || !y) return ''
  const dt = new Date(`${y}-${m}-${d}`)
  return isNaN(dt.getTime()) ? '' : WEEKDAY[dt.getDay()] ?? ''
}
