'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LiveClock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [time, setTime] = useState('')
  const [seconds, setSeconds] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      setSeconds(now.toLocaleTimeString('pt-BR', { second: '2-digit' }))
    }
    update()
    setMounted(true)
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  if (!mounted) return <span className={className} style={style} />

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={className}
      style={style}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={time}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
        >
          {time}
        </motion.span>
      </AnimatePresence>
      <motion.span
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginLeft: 2, marginRight: 2 }}
      >:</motion.span>
      <AnimatePresence mode="wait">
        <motion.span
          key={seconds}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
        >
          {seconds}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}
