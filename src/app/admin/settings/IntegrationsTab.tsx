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
  docs?: string
}

const SERVICES: Service[] = [
  { key: 'supabase', label: 'SUPABASE', description: 'BANCO DE DADOS E AUTENTICACAO', icon: <Database size={20} />, docs: 'https://supabase.com', version: '@supabase/ssr' },
  { key: 'vercel',   label: 'VERCEL',   description: 'HOSPEDAGEM E DEPLOY CONTINUO',  icon: <Cloud    size={20} />, docs: 'https://vercel.com',   version: 'PRODUCAO' },
  { key: 'nextjs',   label: 'NEXT.JS',  description: 'FRAMEWORK FULL-STACK (v16)',    icon: <Zap      size={20} />, docs: 'https://nextjs.org',   version: '16.2.6' },
  { key: 'github',   label: 'GITHUB',   description: 'CONTROLE DE VERSAO E CI/CD',   icon: <GitBranch size={20} />, docs: 'https://github.com',  version: 'MAIN' },
]

const STACK_INFO = [
  { label: 'REACT',           version: '19',          color: '#61dafb' },
  { label: 'FRAMER MOTION',   version: '12',          color: '#ff0055' },
  { label: 'TAILWIND CSS',    version: '4',           color: '#38bdf8' },
  { label: 'TYPESCRIPT',      version: '5',           color: '#3178c6' },
  { label: 'LUCIDE REACT',    version: '0.x',         color: '#f97316' },
  { label: 'SONNER',          version: '1.x',         color: '#8b5cf6' },
  { label: 'ZOOKEEPER',       version: 'BCRYPT',      color: '#10b981' },
  { label: 'REACT HOOK FORM', version: '7',           color: '#ec4899' },
  { label: 'ZOD',             version: '3',           color: '#60a5fa' },
]

export default function IntegrationsTab() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({
    supabase: 'checking', vercel: 'checking', nextjs: 'checking', github: 'checking',
  })
  const [latencies, setLatencies] = useState<Record<string, number>>({})
  const [details, setDetails] = useState<Record<string, string>>({})
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const check = async () => {
    setLoading(true)
    setStatuses({ supabase: 'checking', vercel: 'checking', nextjs: 'checking', github: 'checking' })
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json() as {
          services: Record<string, { status: ServiceStatus; latency?: number; detail?: string }>
        }
        const newStatuses: Record<string, ServiceStatus> = {}
        const newLatencies: Record<string, number> = {}
        const newDetails: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.services)) {
          newStatuses[k] = v.status
          if (v.latency) newLatencies[k] = v.latency
          if (v.detail)  newDetails[k] = v.detail
        }
        setStatuses(newStatuses)
        setLatencies(newLatencies)
        setDetails(newDetails)
        setLastChecked(new Date())
      }
    } catch {
      setStatuses({ supabase: 'offline', vercel: 'offline', nextjs: 'offline', github: 'offline' })
    }
    setLoading(false)
  }

  useEffect(() => { check() }, [])

  const statusConfig: Record<ServiceStatus, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    online:   { color: 'var(--success)', bg: 'rgba(22,163,74,0.1)',   label: 'ONLINE',     icon: <Wifi size={12} /> },
    degraded: { color: 'var(--warning)', bg: 'rgba(217,119,6,0.1)',   label: 'DEGRADADO',  icon: <AlertTriangle size={12} /> },
    offline:  { color: 'var(--danger)',  bg: 'rgba(220,38,38,0.1)',   label: 'OFFLINE',    icon: <WifiOff size={12} /> },
    checking: { color: 'var(--text-3)',  bg: 'rgba(148,163,184,0.1)', label: 'VERIFICANDO',icon: <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" /> },
  }

  const totalOnline = Object.values(statuses).filter(s => s === 'online').length
  const totalServices = SERVICES.length

  return (
    <div className="space-y-6">

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            STATUS DOS SERVICOS
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {totalOnline}/{totalServices} SERVICOS OPERACIONAIS
            {lastChecked && ` — VERIFICADO ${lastChecked.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
          </p>
        </div>
        <button
          onClick={check}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)' }}
        >
          <motion.div animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={13} />
          </motion.div>
          ATUALIZAR
        </button>
      </div>

      {/* Overall health bar */}
      <div className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between text-xs font-bold mb-2" style={{ color: 'var(--text-3)' }}>
          <span>SAUDE GERAL</span>
          <span style={{ color: 'var(--success)' }}>{Math.round((totalOnline / totalServices) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--success)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(totalOnline / totalServices) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map((svc, i) => {
          const st = statuses[svc.key] ?? 'checking'
          const cfg = statusConfig[st]
          return (
            <motion.div
              key={svc.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg)', color: 'var(--primary)' }}
                  >
                    {svc.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{svc.label}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{svc.description}</p>
                    {svc.version && (
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>{svc.version}</p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={st}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
                      >
                        {cfg.icon} {cfg.label}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Latency + detail */}
              {(latencies[svc.key] || details[svc.key]) && (
                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                  {details[svc.key] && (
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                      {details[svc.key]?.toUpperCase()}
                    </p>
                  )}
                  {latencies[svc.key] && (
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: latencies[svc.key] < 500 ? 'var(--success)' : 'var(--warning)' }}>
                      {latencies[svc.key]}MS
                    </span>
                  )}
                </div>
              )}

              {/* Status pulse */}
              {st === 'online' && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--success)' }} />
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--success)' }}>OPERACIONAL</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Stack / Packages */}
      <div>
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-3)' }}>BIBLIOTECAS E DEPENDENCIAS</p>
        <div className="flex flex-wrap gap-2">
          {STACK_INFO.map(pkg => (
            <motion.span
              key={pkg.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
              style={{
                background: `${pkg.color}15`,
                border: `1px solid ${pkg.color}30`,
                color: pkg.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: pkg.color }} />
              {pkg.label} <span style={{ opacity: 0.6 }}>v{pkg.version}</span>
            </motion.span>
          ))}
        </div>
      </div>

    </div>
  )
}
