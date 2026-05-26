'use client'

import { useState, useEffect } from 'react'

export default function LiveClock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={className} style={style}>
      {time}
    </span>
  )
}
