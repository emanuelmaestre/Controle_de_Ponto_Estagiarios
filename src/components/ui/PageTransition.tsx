'use client'

import { motion } from 'framer-motion'

const ease = [0.16, 1, 0.3, 1] as const

const variants = {
  hidden:  { opacity: 0, y: 8, scale: 0.995 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease,
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.995,
    transition: { duration: 0.14, ease: 'easeIn' as const },
  },
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
