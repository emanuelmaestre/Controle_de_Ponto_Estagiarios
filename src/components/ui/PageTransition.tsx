'use client'

import { motion } from 'framer-motion'

const ease = [0.16, 1, 0.3, 1] as const

const variants = {
  hidden:  { opacity: 0, y: 18, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease,
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    transition: { duration: 0.22, ease: 'easeIn' as const },
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
