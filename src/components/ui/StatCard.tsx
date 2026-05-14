'use client'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color?: 'blue' | 'green' | 'amber' | 'gray'
  sub?: string
  delay?: number
}

const colorMap = {
  blue: 'text-blue-700 bg-blue-50',
  green: 'text-emerald-700 bg-emerald-50',
  amber: 'text-amber-700 bg-amber-50',
  gray: 'text-slate-500 bg-slate-100',
}

export default function StatCard({ label, value, icon, color = 'blue', sub, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-2xl p-2 rounded-xl ${colorMap[color]}`}>{icon}</span>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  )
}
