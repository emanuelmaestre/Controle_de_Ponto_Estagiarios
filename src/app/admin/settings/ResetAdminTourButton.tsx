'use client'

import { useState } from 'react'
import { PlayCircle, CheckCircle2 } from 'lucide-react'

export default function ResetAdminTourButton({ userId }: { userId: string }) {
  const [done, setDone] = useState(false)

  const handleReset = () => {
    localStorage.removeItem(`onboarding_done_admin_${userId}`)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <div
      className="rounded-xl p-5 mt-6"
      style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
    >
      <p className="text-[10px] font-bold tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
        TOUR DE APRESENTAÇÃO
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        Reveja a apresentação das seções do painel. O tour será exibido no próximo carregamento do painel.
      </p>
      <button
        onClick={handleReset}
        disabled={done}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
        style={done
          ? { background: 'rgba(63,229,108,0.15)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.3)' }
          : { background: 'rgba(63,229,108,0.1)', color: '#3fe56c', border: '1px solid rgba(63,229,108,0.2)' }
        }
      >
        {done
          ? <><CheckCircle2 size={14} /> Ativado! Recarregue o painel</>
          : <><PlayCircle size={14} /> Ver tour novamente</>}
      </button>
    </div>
  )
}
