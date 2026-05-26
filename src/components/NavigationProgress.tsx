'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth]     = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prev  = useRef(pathname)

  useEffect(() => {
    if (pathname === prev.current) return
    prev.current = pathname

    // Start
    setWidth(0)
    setVisible(true)

    const t1 = setTimeout(() => setWidth(70),  80)
    const t2 = setTimeout(() => setWidth(90), 300)
    const t3 = setTimeout(() => {
      setWidth(100)
      setTimeout(() => setVisible(false), 300)
    }, 500)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [pathname])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nav-progress"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
          style={{ background: 'var(--surface)' }}
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{
              width: `${width}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--primary-light), var(--accent))',
              boxShadow: '0 0 10px var(--primary-light)',
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
