'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, Database, Cloud, Zap, GitBranch, Tag, Plus,
  Wifi, WifiOff, AlertTriangle,
} from 'lucide-react'

type ServiceStatus = 'online' | 'offline' | 'degraded' | 'checking'

interface Service {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  version: string
}

const SERVICES: Service[] = [
  { key: 'supabase', label: 'Supabase',  description: 'Banco de Dados PostgreSQL & Auth',  icon: <Database  size={22} />, version: 'v2.39.2' },
  { key: 'vercel',   label: 'Vercel',    description: 'Edge Hosting & Deployment',         icon: <Cloud     size={22} />, version: 'LATEST'  },
  { key: 'nextjs',   label: 'Next.js',   description: 'Framework de Aplicação',            icon: <Zap       size={22} />, version: '16.2.6'  },
  { key: 'github',   label: 'GitHub',    description: 'Sistema de Controle de Versão',     icon: <GitBranch size={22} />, version: 'N/A'     },
]

const DEPS = [
  { label: 'TypeScript',     version: 'v5.3',   color: '#60a5fa' },
  { label: 'Tailwind CSS',   version: 'v4',     color: '#3fe56c' },
  { label: 'Supabase-js',    version: 'v2.106', color: '#34d399' },
  { label: 'Framer Motion',  version: 'v12',    color: '#a78bfa' },
  { label: 'Lucide React',   version: 'v1.16',  color: '#00c853' },
  { label: 'Zustand',        version: 'v5.0',   color: '#fb923c' },
  { label: 'React Hook Form',version: 'v7.76',  color: '#f472b6' },
  { label: 'Sonner',         version: 'v2.0',   color: '#818cf8' },
  { label: 'XLSX',           version: 'v0.18',  color: '#84cc16' },
  { label: 'Zod',            version: 'v4.4',   color: '#38bdf8' },
]

const statusConfig: Record<ServiceStatus, { color: string; bg: string; border: string; label: string; pulse: boolean }> = {
  online:   { color: '#00c853', bg: 'rgba(0,200,83,0.10)',  border: '#00c853', label: 'DISPONÍVEL',  pulse: true  },
  degraded: { color: '#ffbf00', bg: 'rgba(255,191,0,0.10)', border: '#ffbf00', label: 'DEGRADADO',   pulse: false },
  offline:  { color: '#ff5252', bg: 'rgba(255,82,82,0.10)', border: '#ff5252', label: 'INDISPONÍVEL',pulse: false },
  checking: { color: 'var(--text-3)', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.3)', label: 'VERIFICANDO', pulse: false },
}

export default function IntegrationsTab() {
  const [statuses,    setStatuses]    = useState<Record<string, ServiceStatus>>({
    supabase: 'checking', vercel: 'checking', nextjs: 'checking', github: 'checking',
  })
  const [latencies,   setLatencies]   = useState<Record<string, number | string>>({})
  const [loading,     setLoading]     = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [healthPct,   setHealthPct]   = useState(0)

  const check = async () => {
    setLoading(true)
    setStatuses({ supabase: 'checking', vercel: 'checking', nextjs: 'checking', github: 'checking' })
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json() as {
          services: Record<string, { status: ServiceStatus; latency?: number; detail?: string }>
        }
        const ns: Record<string, ServiceStatus> = {}
        const nl: Record<string, number | string> = {}
        for (const [k, v] of Object.entries(data.services)) {
          ns[k] = v.status
          nl[k] = v.latency ? `${v.latency}ms` : (v.status === 'offline' ? 'Esgotado' : 'N/A')
        }
        setStatuses(ns)
        setLatencies(nl)
        const online = Object.values(ns).filter(s => s === 'online').length
        setHealthPct(Math.round((online / SERVICES.length) * 100))
        setLastChecked(new Date())
      }
    } catch {
      setStatuses({ supabase: 'offline', vercel: 'offline', nextjs: 'offline', github: 'offline' })
      setHealthPct(0)
    }
    setLoading(false)
  }

  useEffect(() => { check() }, [])

  const totalOnline = Object.values(statuses).filter(s => s === 'online').length

  return (
    <div className="flex flex-col gap-6">

      {/* ── 1. Saúde Geral do Sistema ── */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h3 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Saúde Geral do Sistema
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Desempenho agregado em tempo real de toda a infraestrutura em nuvem conectada.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-5xl font-bold leading-none" style={{ color: '#3fe56c' }}>
              {totalOnline === 0 && statuses.supabase === 'checking' ? '…' : `${Math.round((totalOnline / SERVICES.length) * 100)}%`}
            </p>
            <p className="text-[10px] font-bold tracking-wider mt-1" style={{ color: '#00c853' }}>OTIMIZADO</p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 16, background: 'var(--bg)', border: '1px solid rgba(0,200,83,0.15)' }}
        >
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: 'linear-gradient(90deg, #00c853, #3fe56c)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${(totalOnline / SERVICES.length) * 100}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15))' }} />
          </motion.div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-3)' }}>0% CRÍTICO</span>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-3)' }}>100% OPERACIONAL</span>
        </div>
      </div>

      {/* ── 2. Clusters de Serviço ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Clusters de Serviço</h3>
          <button
            onClick={check}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-wider transition-all hover:opacity-80 disabled:opacity-50"
            style={{ border: '1px solid rgba(0,200,83,0.25)', color: '#3fe56c', background: 'transparent' }}
          >
            <motion.div animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={13} />
            </motion.div>
            ATUALIZAR
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SERVICES.map((svc, i) => {
            const st  = statuses[svc.key] ?? 'checking'
            const cfg = statusConfig[st]
            const lat = latencies[svc.key]
            const isOffline = st === 'offline'

            return (
              <motion.div
                key={svc.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl p-5 flex flex-col transition-all"
                style={{
                  background: 'var(--surface-card, #0f2318)',
                  border: '1px solid rgba(0,200,83,0.15)',
                  opacity: isOffline ? 0.85 : 1,
                  minHeight: 200,
                }}
              >
                {/* Top: icon + badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid rgba(0,200,83,0.15)',
                      color: isOffline ? '#ff5252' : '#3fe56c',
                    }}
                  >
                    {svc.icon}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={st}
                      initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                    >
                      {cfg.pulse ? (
                        <span className="relative flex w-1.5 h-1.5">
                          <span className="animate-ping absolute inline-flex w-full h-full rounded-full opacity-75" style={{ background: cfg.color }} />
                          <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      )}
                      {cfg.label}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Name + description — flex-1 empurra os dados para baixo */}
                <div className="flex-1">
                  <h4 className="font-bold text-base mb-1" style={{ color: 'var(--text)' }}>{svc.label}</h4>
                  <p className="text-sm" style={{ color: 'var(--text-3)', lineHeight: 1.4 }}>{svc.description}</p>
                </div>

                {/* Divisória */}
                <div className="my-4" style={{ height: 1, background: 'rgba(0,200,83,0.10)' }} />

                {/* Version + Latency — sempre na base */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Versão</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text)' }}>{svc.version}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Latência</span>
                    <span className="font-mono font-bold" style={{ color: isOffline ? '#ff5252' : st === 'checking' ? 'var(--text-3)' : '#3fe56c' }}>
                      {st === 'checking' ? '…' : (lat ?? 'N/A')}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── 3. Dependências Principais ── */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Tag size={18} style={{ color: '#3fe56c' }} />
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Dependências Principais</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {DEPS.map((dep, i) => (
            <motion.div
              key={dep.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg cursor-default transition-all"
              style={{
                background: 'var(--bg)',
                border: '1px solid rgba(0,200,83,0.15)',
              }}
              whileHover={{ borderColor: 'rgba(0,200,83,0.40)' }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dep.color }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{dep.label}</span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-3)' }}>{dep.version}</span>
            </motion.div>
          ))}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-wider transition-all"
            style={{
              border: '1px dashed rgba(0,200,83,0.25)',
              color: 'var(--text-3)',
              background: 'transparent',
            }}
          >
            <Plus size={13} />
            ADICIONAR MÓDULO
          </button>
        </div>
      </div>

      {/* ── 4. Sincronização CI/CD Automatizada ── */}
      <div
        className="relative overflow-hidden rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
      >
        {/* background glows */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'rgba(63,229,108,0.05)', filter: 'blur(40px)' }} />
        <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'rgba(149,214,154,0.04)', filter: 'blur(40px)' }} />

        <div className="relative z-10">
          <h4 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Sincronização CI/CD Automatizada
          </h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-3)', maxWidth: 480 }}>
            O Chronos Lab pode detectar automaticamente e atualizar as tags de configuração com base no arquivo{' '}
            <code
              className="px-1.5 py-0.5 rounded text-sm"
              style={{ background: 'var(--bg)', color: '#3fe56c', border: '1px solid rgba(0,200,83,0.20)' }}
            >
              package.json
            </code>{' '}
            do seu repositório.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="relative z-10 px-8 py-3 rounded-lg font-bold text-sm whitespace-nowrap flex-shrink-0 transition-all"
          style={{ background: '#3fe56c', color: '#003912', boxShadow: '0 4px 20px rgba(63,229,108,0.30)' }}
        >
          ATIVAR SINCRONIZAÇÃO AUTOMÁTICA
        </motion.button>
      </div>

    </div>
  )
}
