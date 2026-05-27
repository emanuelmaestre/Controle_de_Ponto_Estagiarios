'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="p-5 rounded-3xl mb-5" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
        <WifiOff size={44} style={{ color: 'var(--danger)' }} />
      </div>
      <h1 className="text-lg font-black mb-1" style={{ color: 'var(--text)' }}>SEM CONEXAO</h1>
      <p className="text-sm mb-6 max-w-sm" style={{ color: 'var(--text-3)' }}>
        Verifique sua conexao com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 font-bold rounded-xl transition-all hover:opacity-90"
        style={{ background: 'var(--primary)', color: 'white' }}
      >
        TENTAR NOVAMENTE
      </button>
    </div>
  )
}
