import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ChronosLab — Controle de Ponto'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07170c',
          fontFamily: 'sans-serif',
          gap: 32,
        }}
      >
        {/* Stopwatch icon */}
        <svg width="140" height="140" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="180" height="180" rx="40" fill="#07170c"/>
          <circle cx="90" cy="105" r="52" fill="none" stroke="#00c853" strokeWidth="7"/>
          <rect x="74" y="30" width="32" height="12" rx="6" fill="#00c853"/>
          <line x1="90" y1="42" x2="90" y2="53" stroke="#00c853" strokeWidth="7" strokeLinecap="round"/>
          <line x1="38" y1="65" x2="48" y2="75" stroke="#00c853" strokeWidth="5" strokeLinecap="round"/>
          <line x1="142" y1="65" x2="132" y2="75" stroke="#00c853" strokeWidth="5" strokeLinecap="round"/>
          <line x1="90" y1="105" x2="90" y2="65" stroke="#3fe56c" strokeWidth="7" strokeLinecap="round"/>
          <line x1="90" y1="105" x2="120" y2="83" stroke="#00c853" strokeWidth="5" strokeLinecap="round"/>
          <circle cx="90" cy="105" r="7" fill="#3fe56c"/>
        </svg>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#3fe56c', letterSpacing: '-2px' }}>
            Chronos
          </span>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#C0392B', letterSpacing: '-2px' }}>
            Lab
          </span>
        </div>

        {/* Subtitle */}
        <p style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', margin: 0, letterSpacing: '4px', fontWeight: 600 }}>
          CONTROLE DE PONTO
        </p>

        {/* URL */}
        <p style={{ fontSize: 20, color: 'rgba(0,200,83,0.5)', margin: 0, letterSpacing: '1px' }}>
          controle-de-ponto-estagiarios.vercel.app
        </p>
      </div>
    ),
    { ...size }
  )
}
