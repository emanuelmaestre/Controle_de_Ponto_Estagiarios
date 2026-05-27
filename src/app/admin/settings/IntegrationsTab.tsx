'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Database, Cloud, Zap, GitBranch } from 'lucide-react'

type ServiceStatus = 'online' | 'offline' | 'degraded' | 'checking'

interface Service {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  version?: string
}

const SERVICES: Service[] = [
  { key: 'supabase', label: 'SUPABASE',  description: 'BANCO DE DADOS E AUTH',      icon: <Database  size={16} />, version: '@supabase/ssr 0.10' },
  { key: 'vercel',   label: 'VERCEL',    description: 'HOSPEDAGEM E DEPLOY',        icon: <Cloud     size={16} />, version: 'PRODUÇÃO' },
  { key: 'nextjs',   label: 'NEXT.JS',   description: 'FRAMEWORK FULL-STACK',       icon: <Zap       size={16} />, version: '16.2.6' },
  { key: 'github',   label: 'GITHUB',    description: 'CONTROLE DE VERSÃO E CI/CD', icon: <GitBranch size={16} />, version: 'MAIN' },
]

const STACK_INFO = [
  { label: 'REACT',           version: '19.2',   color: '#61dafb' },
  { label: 'NEXT.JS',         version: '16.2.6', color: '#ffffff' },
  { label: 'TYPESCRIPT',      version: '5',      color: '#3178c6' },
  { label: 'TAILWIND CSS',    version: '4',      color: '#38bdf8' },
  { label: 'FRAMER MOTION',   version: '12',     color: '#ff0055' },
  { label: 'SUPABASE JS',     version: '2.106',  color: '#3ecf8e' },
  { label: 'REACT HOOK FORM', version: '7.76',   color: '#ec4899' },
  { label: 'ZOD',             version: '4.4',    color: '#60a5fa' },
  { label: 'ZUSTAND',         version: '5.0',    color: '#f97316' },
  { label: 'LUCIDE REACT',    version: '1.16',   color: '#fbbf24' },
  { label: 'SONNER',          version: '2.0',    color: '#8b5cf6' },
  { label: 'RECHARTS',        version: '3.8',    color: '#22d3ee' },
  { label: 'REACT QUERY',     version: '5.100',  color: '#ef4444' },
  { label: 'BCRYPTJS',        version: '3.0',    color: '#10b981' },
  { label: 'XLSX',            version: '0.18',   color: '#84cc16' },
  { label: 'SWR',             version: '2.4',    color: '#a78bfa' },
]

export default function IntegrationsTab() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({
    supabase: 'checking', vercel: 'checking', nextjs: 'checking', github: 'checking',
  })
  const [latencies, setLatencies]   = useState<Record<string, number>>({})
  const [details,   setDetails]     = useState<Record<string, string>>({})
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [loading, setLoading]       = useState(false)

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
        const nl: Record<string, number>        = {}
        const nd: Record<string, string>        = {}
        for (const [k, v] of Object.entries(data.services)) {
          ns[k] = v.status
          if (v.latency) nl[k] = v.latency
          if (v.detail)  nd[k] = v.detail
        }
        setStatuses(ns); setLatencies(nl); setDetails(nd)
        setLastChecked(new Date())
      }
    } catch {
      setStatuses({ supabase: 'offline', vercel: 'offline', nextjs: 'offline', github: 'offline' })
    }
    setLoading(false)
  }

  useEffect(() => { check() }, [])

  const statusConfig: Record<ServiceStatus, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    online:   { color: 'var(--success)', bg: 'rgba(22,163,74,0.1)',   label: 'ONLINE',      icon: <Wifi size={10} /> },
    degraded: { color: 'var(--warning)', bg: 'rgba(217,119,6,0.1)',   label: 'DEGRADADO',   icon: <AlertTriangle size={10} /> },
    offline:  { color: 'var(--danger)',  bg: 'rgba(220,38,38,0.1)',   label: 'OFFLINE',     icon: <WifiOff size={10} /> },
    checking: { color: 'var(--text-3)', bg: 'rgba(148,163,184,0.1)', label: 'VERIFICANDO', icon: <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" /> },
  }

  const totalOnline   = Object.values(statuses).filter(s => s === 'online').length
  const totalServices = SERVICES.length

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Header: status + refresh ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>STATUS DOS SERVIÇOS</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {totalOnline}/{totalServices} OPERACIONAIS
            {lastChecked && ` — ${lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </p>
        </div>
        <button
          onClick={check} disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <motion.div animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={11} />
          </motion.div>
          ATUALIZAR
        </button>
      </div>

      {/* ── Saúde geral ── */}
      <div className="rounded-xl px-3 py-2 flex-shrink-0" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-3)' }}>
          <span>SAÚDE GERAL</span>
          <span style={{ color: 'var(--success)' }}>{Math.round((totalOnline / totalServices) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--success)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(totalOnline / totalServices) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* ── Service cards 2×2 / 4×1 em telas largas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-shrink-0">
        {SERVICES.map((svc, i) => {
          const st  = statuses[svc.key] ?? 'checking'
          const cfg = statusConfig[st]
          return (
            <motion.div
              key={svc.key}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl p-3"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface)', color: 'var(--primary)' }}>
                    {svc.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[11px] leading-none" style={{ color: 'var(--text)' }}>{svc.label}</p>
                    {svc.version && <p className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>{svc.version}</p>}
                  </div>
                </div>
                {/* Status badge */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={st}
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                  >
                    {cfg.icon} {cfg.label}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Bottom: detail + latency + pulse */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {st === 'online' && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'var(--success)' }} />
                    </span>
                  )}
                  {details[svc.key] && (
                    <p className="text-[9px] truncate" style={{ color: 'var(--text-3)' }}>
                      {details[svc.key]?.toUpperCase()}
                    </p>
                  )}
                </div>
                {latencies[svc.key] && (
                  <span className="text-[9px] font-bold tabular-nums flex-shrink-0"
                    style={{ color: latencies[svc.key] < 500 ? 'var(--success)' : 'var(--warning)' }}>
                    {latencies[svc.key]}MS
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Stack badges ── */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--text-3)' }}>BIBLIOTECAS E DEPENDÊNCIAS</p>
        <div className="flex flex-wrap gap-1.5">
          {STACK_INFO.map(pkg => (
            <motion.span
              key={pkg.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold"
              style={{ background: `${pkg.color}15`, border: `1px solid ${pkg.color}30`, color: pkg.color }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: pkg.color }} />
              {pkg.label} <span style={{ opacity: 0.6 }}>v{pkg.version}</span>
            </motion.span>
          ))}
        </div>
      </div>

    </div>
  )
}
