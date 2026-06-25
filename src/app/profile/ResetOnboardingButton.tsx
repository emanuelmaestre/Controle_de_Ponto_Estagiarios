'use client'

import { useState } from 'react'
import { PlayCircle, CheckCircle2 } from 'lucide-react'

export default function ResetOnboardingButton({ userId }: { userId: string }) {
  const [done, setDone] = useState(false)

  const handleReset = () => {
    localStorage.removeItem(`onboarding_done_${userId}`)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div
      className="flex items-center justify-between p-4 rounded-2xl"
      style={{ background: 'rgba(63,229,108,0.05)', border: '1px solid rgba(63,229,108,0.12)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <PlayCircle size={18} className="flex-shrink-0" style={{ color: '#3fe56c' }} />
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Ver tutorial novamente</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            O tour de apresentação será exibido no próximo acesso ao Início
          </p>
        </div>
      </div>

      <button
        onClick={handleReset}
        disabled={done}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ml-3"
        style={done
          ? { background: 'rgba(63,229,108,0.15)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.3)' }
          : { background: 'rgba(63,229,108,0.1)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.2)' }
        }
      >
        {done ? <><CheckCircle2 size={13} /> Ativado!</> : 'Reativar'}
      </button>
    </div>
  )
}
