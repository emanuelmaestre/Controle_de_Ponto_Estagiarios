'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Props {
  pct: number          // 0–100
  color: string
  height?: number      // px, default 10
  className?: string
}

export default function AnimatedBar({ pct, color, height = 10, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <div
      ref={ref}
      className={`rounded-full overflow-hidden ${className ?? ''}`}
      style={{ background: 'var(--surface-variant)', height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={inView ? { width: `${Math.min(100, pct)}%` } : { width: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />
    </div>
  )
}
