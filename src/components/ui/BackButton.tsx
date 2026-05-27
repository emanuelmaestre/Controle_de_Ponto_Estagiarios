'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

interface Props {
  href: string
  /** 'dark' = inside nav-bg header (white text), 'light' = on surface bg (muted text) */
  variant?: 'dark' | 'light'
  className?: string
}

export default function BackButton({ href, variant = 'light', className = '' }: Props) {
  const isDark = variant === 'dark'

  return (
    <Link href={href} className={className}>
      <motion.div
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.93 }}
        className="group flex items-center gap-1.5 select-none"
        style={{ width: 'fit-content' }}
      >
        {/* Arrow circle */}
        <motion.div
          whileHover={{ scale: 1.12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: isDark ? 'rgba(255,255,255,0.10)' : 'var(--bg)',
            border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid var(--border)',
          }}
        >
          <motion.div
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <ArrowLeft
              size={13}
              style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'var(--text-3)' }}
            />
          </motion.div>
        </motion.div>

        {/* Label */}
        <span
          className="text-[11px] font-black tracking-wider transition-all"
          style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'var(--text-3)' }}
        >
          VOLTAR
        </span>
      </motion.div>
    </Link>
  )
}
