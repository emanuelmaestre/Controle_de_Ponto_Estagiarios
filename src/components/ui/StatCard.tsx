'use client'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'amber' | 'gray' | 'red'
  sub?: string
  delay?: number
}

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  green: { icon: 'var(--success)',  bg: 'rgba(22,163,74,0.09)',  border: 'rgba(22,163,74,0.18)'  },
  blue:  { icon: 'var(--info)',     bg: 'rgba(14,165,233,0.09)', border: 'rgba(14,165,233,0.18)' },
  amber: { icon: 'var(--warning)',  bg: 'rgba(217,119,6,0.09)',  border: 'rgba(217,119,6,0.18)'  },
  red:   { icon: 'var(--danger)',   bg: 'rgba(220,38,38,0.09)',  border: 'rgba(220,38,38,0.18)'  },
  gray:  { icon: 'var(--text-2)',   bg: 'var(--bg-secondary)',   border: 'var(--border)'          },
}

export default function StatCard({ label, value, icon, color = 'gray', sub, delay = 0 }: StatCardProps) {
  const c = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: c.bg, border: `1px solid ${c.border}` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest truncate" style={{ color: 'var(--text-3)' }}>
          {label}
        </p>
        <p className="text-2xl font-black mt-0.5 leading-none" style={{ color: c.icon }}>
          {value}
        </p>
        {sub && <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
    </motion.div>
  )
}
