import React from 'react'
import {
  Font, View, Text, Svg,
  Path, Circle, Line, G,
  StyleSheet,
} from '@react-pdf/renderer'
import path from 'path'

// ── Fontes ────────────────────────────────────────────────────────────────────
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

// ── Paleta ────────────────────────────────────────────────────────────────────
export const C = {
  white:      '#ffffff',
  pageBg:     '#ffffff',
  secBar:     '#122216',
  secText:    '#3fe56c',
  green:      '#1E6B35',   // verde oficial da logo
  greenAccent:'#1a9c45',
  greenLight: '#eaf7ee',
  greenMid:   '#c6ecd2',
  red:        '#C0392B',   // vermelho oficial da logo
  blue:       '#2563eb',
  orange:     '#d97706',
  yellow:     '#ca8a04',
  gray:       '#6b7280',
  border:     '#d1d5db',
  borderCard: '#e5e7eb',
  rowAlt:     '#f4f8f4',
  text:       '#111827',
  textSub:    '#1f2937',
  textMuted:  '#4b5563',
  footerBg:   '#eef4ee',
}

export const M       = 14   // margem horizontal da página
export const HEADER_H = 66  // altura reservada para o header fixo (pt)

// ── Logo oficial (Flask + Cronômetro + Molécula — /public/logo.svg) ───────────
export function Logo() {
  // viewBox original: "0 0 280 80" — usamos só a parte icônica (0 0 108 84)
  return (
    <Svg width="54" height="42" viewBox="0 0 108 84">

      {/* Flask — translate(4, 4) */}
      <G transform="translate(4, 4)">
        <Path
          d="M18 6 L18 28 L8 46 Q6 50 8 53 Q10 56 14 56 L34 56 Q38 56 40 53 Q42 50 40 46 L30 28 L30 6 Z"
          fill="none" stroke={C.green} strokeWidth="2.5" strokeLinejoin="round"
        />
        <Path
          d="M10 46 L12 42 L36 42 L38 46 Q40 50 38 53 Q36 56 32 56 L16 56 Q12 56 10 53 Q8 50 10 46 Z"
          fill={C.red} opacity="0.85"
        />
        <Circle cx="17" cy="47" r="2.5" fill="white" opacity="0.6" />
        <Circle cx="24" cy="51" r="1.5" fill="white" opacity="0.5" />
        <Circle cx="29" cy="47" r="1.8" fill="white" opacity="0.5" />
        <Line x1="18" y1="6" x2="30" y2="6" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
      </G>

      {/* Cronômetro — translate(28, 2) */}
      <G transform="translate(28, 2)">
        <Circle cx="24" cy="30" r="22" fill="none" stroke={C.green} strokeWidth="2.5" />
        <Path d="M18 8 L30 8" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="24" y1="8"  x2="24" y2="4"  stroke={C.green} strokeWidth="2.5" strokeLinecap="round" />
        <Line x1="24" y1="30" x2="24" y2="16" stroke={C.green} strokeWidth="2"   strokeLinecap="round" />
        <Line x1="24" y1="30" x2="33" y2="24" stroke={C.red}   strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="24" cy="30" r="2.5" fill={C.green} />
        <Line x1="24" y1="10" x2="24" y2="12" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="24" y1="48" x2="24" y2="50" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="4"  y1="30" x2="6"  y2="30" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="42" y1="30" x2="44" y2="30" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" />
      </G>

      {/* Molécula — translate(68, 20) */}
      <G transform="translate(68, 20)">
        <Circle cx="18" cy="8"  r="4" fill={C.red} />
        <Circle cx="8"  cy="22" r="3" fill="none" stroke={C.green} strokeWidth="2" />
        <Circle cx="22" cy="28" r="3" fill="none" stroke={C.green} strokeWidth="2" />
        <Circle cx="4"  cy="38" r="4" fill={C.red} />
        <Line x1="18" y1="8"  x2="8"  y2="22" stroke={C.green} strokeWidth="1.8" />
        <Line x1="8"  y1="22" x2="22" y2="28" stroke={C.green} strokeWidth="1.8" />
        <Line x1="8"  y1="22" x2="4"  y2="38" stroke={C.green} strokeWidth="1.8" />
      </G>

    </Svg>
  )
}

// ── Estilos compartilhados ────────────────────────────────────────────────────
export const shared = StyleSheet.create({
  // Barra de seção
  secBar: {
    backgroundColor: C.secBar,
    marginHorizontal: -M,
    paddingHorizontal: M,
    paddingVertical: 6,
  },
  secBarText: {
    fontSize: 8.5, fontWeight: 700, color: C.secText, letterSpacing: 0.8,
  },

  // Tabela
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

  // Totais
  totalsBox: {
    backgroundColor: C.greenLight,
    borderTopWidth: 1, borderColor: C.greenMid,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  totalLine:     { flexDirection: 'row', marginBottom: 5 },
  totalLineLast: { flexDirection: 'row' },
  totalLabel:    { fontSize: 9, fontWeight: 700, color: C.textSub, width: 130 },
  totalValue:    { fontSize: 9, fontWeight: 700, color: C.greenAccent },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.footerBg,
    borderTopWidth: 1, borderColor: C.borderCard,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: M, paddingVertical: 5,
  },
  footerLeft:  { fontSize: 6.5, color: C.textSub },
  footerRight: { fontSize: 8,   fontWeight: 700, color: C.red },
})

// ── Header fixo (repete em todas as páginas) ──────────────────────────────────
export function PageHeader({
  title,
  institutionName,
  supervisorName,
  periodLabel,
}: {
  title:           string
  institutionName: string
  supervisorName?: string
  periodLabel?:    string
}) {
  const today = new Date().toLocaleDateString('pt-BR')

  return (
    <View
      fixed
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        backgroundColor: C.white,
        borderBottomWidth: 1, borderColor: C.borderCard,
      }}
    >
      {/* Faixa verde no topo */}
      <View style={{ height: 3, backgroundColor: C.greenAccent }} />

      {/* Linha principal: Logo | Título | Info */}
      <View style={{
        flexDirection: 'row',
        alignItems:    'center',
        paddingHorizontal: M,
        paddingTop: 8,
        paddingBottom: 9,
      }}>

        {/* Logo oficial */}
        <View style={{ width: 56, alignItems: 'flex-start', justifyContent: 'center' }}>
          <Logo />
        </View>

        {/* Título central */}
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: 0.2 }}>
            {title}
          </Text>
        </View>

        {/* Bloco de info à direita */}
        <View style={{ width: 115, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 8.5, fontWeight: 700, color: C.text }}>
            {institutionName}
          </Text>
          {supervisorName ? (
            <Text style={{ fontSize: 7.5, color: C.textSub, marginTop: 2 }}>
              {supervisorName}
            </Text>
          ) : null}
          {periodLabel ? (
            <Text style={{ fontSize: 7.5, color: C.greenAccent, marginTop: 2 }}>
              Período: {periodLabel}
            </Text>
          ) : null}
          <Text style={{ fontSize: 7.5, color: C.textSub, marginTop: 2 }}>
            Emissão: {today}
          </Text>
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
    <Svg width="180" height="2" viewBox="0 0 180 2">
      <Line x1="0" y1="1" x2="180" y2="1" stroke={C.borderCard} strokeWidth="1" />
    </Svg>
  )
}

// ── Barra de progresso (View puro — sem SVG text) ─────────────────────────────
export function ProgressBar({ pct, label }: { pct: number; label: string }) {
  const filled = Math.max(2, Math.min(100, pct))
  return (
    <View style={{ height: 22, position: 'relative', marginBottom: 10 }}>
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: C.greenMid,
      }} />
      <View style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${filled}%`,
        backgroundColor: C.greenAccent,
      }} />
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{
          fontSize: 9, fontWeight: 700, color: C.white,
          letterSpacing: 0.3, fontFamily: 'Poppins',
        }}>
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

// ── Dia da semana a partir de "dd/mm/yyyy" ────────────────────────────────────
const WEEKDAY: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
}
export function dowFromBr(dateStr: string): string {
  const [d, m, y] = dateStr.split('/')
  if (!d || !m || !y) return ''
  const dt = new Date(`${y}-${m}-${d}`)
  return isNaN(dt.getTime()) ? '' : WEEKDAY[dt.getDay()] ?? ''
}
