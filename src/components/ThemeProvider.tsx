'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'green' | 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'green',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('green')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('cl-theme')
    // accept 'lab' as legacy alias for 'green'
    const resolved: Theme =
      saved === 'lab' ? 'green'
      : saved === 'dark' || saved === 'light' || saved === 'green' ? (saved as Theme)
      : 'green'
    setThemeState(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem('cl-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  if (!mounted) return <>{children}</>

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
