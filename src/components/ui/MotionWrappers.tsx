'use client'

import { motion, type Variants } from 'framer-motion'
import { ReactNode } from 'react'

const ease = [0.16, 1, 0.3, 1] as const

export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({ children, className = '', stagger = 0.045 }: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  // When h-full is requested, make the wrapper a flex column so the child can stretch
  const base = className.includes('h-full') ? 'flex flex-col ' : ''
  return (
    <motion.div
      variants={{
        hidden:  { opacity: 0, y: 10, scale: 0.98 },
        visible: { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.22, ease } },
      }}
      className={base + className}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({ children, delay = 0, from = 'left', className = '' }: { children: ReactNode; delay?: number; from?: 'left' | 'right'; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: from === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.38, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -8, scale: 0.99  }}
      transition={{ duration: 0.38, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
