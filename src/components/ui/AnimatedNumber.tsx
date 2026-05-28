'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface Props {
  value: number
  duration?: number   // ms
  decimals?: number
  prefix?: string
  suffix?: string
  padStart?: number   // e.g. 2 → "03"
  className?: string
  style?: React.CSSProperties
}

export default function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  padStart,
  className,
  style,
}: Props) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    if (!inView) return
    startTime.current = null

    const animate = (ts: number) => {
      if (startTime.current === null) startTime.current = ts
      const elapsed = ts - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplay(eased * value)
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      }
    }

    rafId.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId.current)
  }, [inView, value, duration])

  const formatted = (() => {
    const num = display.toFixed(decimals)
    if (padStart) return num.padStart(padStart, '0')
    return num
  })()

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
