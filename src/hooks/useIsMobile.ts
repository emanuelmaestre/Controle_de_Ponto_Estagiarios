'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      const isNarrow = window.innerWidth < 768
      setIsMobile(isMobileUA || isNarrow)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}
