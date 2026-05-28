'use client'

import { useTheme, type Theme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Leaf } from 'lucide-react'

const themes: { value: Theme; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'green', label: 'Verde',  icon: <Leaf size={14} />, color: 'text-emerald-400' },
  { value: 'dark',  label: 'Escuro', icon: <Moon size={14} />, color: 'text-indigo-400'  },
  { value: 'light', label: 'Claro',  icon: <Sun  size={14} />, color: 'text-amber-400'   },
]

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  const current = themes.find(t => t.value === theme) ?? themes[0]

  if (compact) {
    const next: Theme = theme === 'green' ? 'dark' : theme === 'dark' ? 'light' : 'green'
    return (
      <motion.button
        onClick={() => setTheme(next)}
        whileTap={{ scale: 0.85 }}
        title={`Tema: ${current.label} → ${themes.find(t => t.value === next)?.label}`}
        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
        style={{ color: 'var(--nav-fg)' }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={theme}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate:   0, opacity: 1, scale: 1   }}
            exit={{   rotate:  90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className={current.color}
          >
            {current.icon}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      {themes.map(t => (
        <motion.button
          key={t.value}
          onClick={() => setTheme(t.value)}
          whileTap={{ scale: 0.9 }}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            theme === t.value ? t.color : 'opacity-50 hover:opacity-75'
          }`}
          style={{ color: theme === t.value ? undefined : 'var(--text-2)' }}
        >
          {theme === t.value && (
            <motion.div
              layoutId="theme-pill"
              className="absolute inset-0 rounded-lg"
              style={{ background: 'var(--surface)', boxShadow: 'var(--card-shadow)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            {t.icon}
            {t.label}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
