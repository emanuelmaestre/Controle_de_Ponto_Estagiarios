'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  intensity?: 'sm' | 'md'   // how much it lifts
}

/**
 * Thin wrapper that adds a subtle lift + glow on hover.
 * Use it as a drop-in around any card div/Link that lacks Framer Motion.
 */
export default function HoverCard({ children, className = '', style, intensity = 'sm' }: Props) {
  const lift = intensity === 'md' ? -4 : -2
  const scale = intensity === 'md' ? 1.015 : 1.008

  return (
    <motion.div
      className={className}
      style={style}
      whileHover={{ y: lift, scale, boxShadow: '0 8px 28px rgba(0,0,0,0.35)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
    >
      {children}
    </motion.div>
  )
}
