import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import AdminNav from '@/components/AdminNav'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/MotionWrappers'
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Clock, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface LocationAttempt {
  id: string
  user_name: string | null
  attempted_at: string
  action_type: string
  geo_lat: number | null
  geo_lng: number | null
  geo_accuracy: number | null
  geo_distance: number | null
  geo_status: string
  block_reason: string | null
  user_agent: string | null
  created_at: string
}

interface GeoRecord {
  id: string
  intern_id: string
  clock_in: string
  geo_lat: number | null
  geo_lng: number | null
  geo_accuracy: number | null
  geo_distance: number | null
  geo_status: string | null
  profiles: { full_name: string } | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  approved:        { label: 'Aprovado',           color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={12} /> },
  blocked:         { label: 'Bloqueado',           color: 'text-red-600 bg-red-50 border-red-200',             icon: <XCircle size={12} /> },
  permission_denied:{ label: 'Permissão negada',   color: 'text-orange-600 bg-orange-50 border-orange-200',    icon: <AlertTriangle size={12} /> },
  unavailable:     { label: 'GPS indisponível',    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',    icon: <AlertTriangle size={12} /> },
  timeout:         { label: 'Tempo esgotado',      color: 'text-orange-600 bg-orange-50 border-orange-200',    icon: <Clock size={12} /> },
  admin_exempt:    { label: 'Admin (isento)',       color: 'text-blue-600 bg-blue-50 border-blue-200',          icon: <Shield size={12} /> },
  geo_disabled:    { label: 'Geo desativado',      color: 'text-slate-600 bg-slate-50 border-slate-200',       icon: <MapPin size={12} /> },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'text-slate-600 bg-slate-50 border-slate-200', icon: <MapPin size={12} /> }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function LocationPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch blocked attempts
  const { data: attemptsRaw } = await supabase
    .from('location_attempts')
    .select('*')
    .order('attempted_at', { ascending: false })
    .limit(100)
  const attempts = (attemptsRaw ?? []) as LocationAttempt[]

  // Fetch approved clock-ins with geo data
  const { data: recordsRaw } = await supabase
    .from('time_records')
    .select('id, intern_id, clock_in, geo_lat, geo_lng, geo_accuracy, geo_distance, geo_status, profiles(full_name)')
    .not('geo_status', 'is', null)
    .order('clock_in', { ascending: false })
    .limit(100)
  const records = (recordsRaw ?? []) as unknown as GeoRecord[]

  // Stats
  const totalBlocked = attempts.filter(a => a.geo_status === 'blocked').length
  const totalPermission = attempts.filter(a => a.geo_status === 'permission_denied').length
  const totalApproved = records.filter(r => r.geo_status === 'approved').length
  const totalAttempts = attempts.length

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>
      <AdminNav />

      {/* Header compacto */}
      <div className="flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/admin" className="text-sm font-bold hover:opacity-70" style={{ color: 'var(--text-3)' }}>
            &larr; PAINEL
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <div>
            <h1 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              HISTORICO DE LOCALIZACAO
            </h1>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
              REGISTROS E TENTATIVAS DE PONTO COM DADOS DE GEOLOCALIZACAO
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Aprovados', value: totalApproved, color: 'var(--success)', icon: '✅' },
            { label: 'Bloqueados', value: totalBlocked, color: 'var(--danger)', icon: '🚫' },
            { label: 'Perm. negada', value: totalPermission, color: 'var(--warning)', icon: '🔒' },
            { label: 'Total tent.', value: totalAttempts, color: 'var(--info)', icon: '📍' },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.05}>
              <div
                className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Blocked attempts */}
        <FadeIn delay={0.15}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <XCircle size={16} style={{ color: 'var(--danger)' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  Tentativas bloqueadas / falhas
                </h2>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
              >
                {attempts.length}
              </span>
            </div>

            {attempts.length === 0 ? (
              <div className="py-10 text-center" style={{ color: 'var(--text-3)' }}>
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm font-medium">Nenhuma tentativa bloqueada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Usuário', 'Data/Hora', 'Status', 'Distância', 'Precisão', 'Motivo'].map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text-3)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, i) => (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: i < attempts.length - 1 ? '1px solid var(--border)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                          {a.user_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-2)' }}>
                          {formatDateTime(a.attempted_at)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.geo_status} />
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-2)' }}>
                          {a.geo_distance != null ? `${a.geo_distance}m` : '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-3)' }}>
                          {a.geo_accuracy != null ? `±${Math.round(a.geo_accuracy)}m` : '—'}
                        </td>
                        <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--text-3)' }}>
                          <span className="truncate block text-xs">{a.block_reason ?? '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Approved with geo */}
        <FadeIn delay={0.25}>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                  Registros aprovados com localização
                </h2>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(22,163,74,0.1)', color: 'var(--success)' }}
              >
                {records.length}
              </span>
            </div>

            {records.length === 0 ? (
              <div className="py-10 text-center" style={{ color: 'var(--text-3)' }}>
                <p className="text-3xl mb-2">📍</p>
                <p className="text-sm font-medium">Nenhum registro com localização ainda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Usuário', 'Entrada', 'Status', 'Distância', 'Precisão', 'Coordenadas'].map(h => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text-3)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: i < records.length - 1 ? '1px solid var(--border)' : 'none',
                          background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--text)' }}>
                          {r.profiles?.full_name ?? '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-2)' }}>
                          {formatDateTime(r.clock_in)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.geo_status ?? 'unknown'} />
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-2)' }}>
                          {r.geo_distance != null ? `${r.geo_distance}m` : '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-3)' }}>
                          {r.geo_accuracy != null ? `±${Math.round(r.geo_accuracy)}m` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-3)' }}>
                          {r.geo_lat != null && r.geo_lng != null
                            ? `${r.geo_lat.toFixed(5)}, ${r.geo_lng.toFixed(5)}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FadeIn>

      </div></main>
    </div>
  )
}
