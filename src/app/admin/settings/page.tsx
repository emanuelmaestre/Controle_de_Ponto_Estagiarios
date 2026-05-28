import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Settings } from '@/types/database'
import SettingsForm from './SettingsForm'
import ChangePinForm from './ChangePinForm'
import GeoSettings from './GeoSettings'
import IntegrationsTab from './IntegrationsTab'
import { Settings as SettingsIcon, Plug, Shield } from 'lucide-react'
import { FadeIn } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

type Tab = 'geral' | 'integracoes' | 'seguranca'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab: tabParam } = await searchParams
  const activeTab = (['geral', 'integracoes', 'seguranca'].includes(tabParam ?? '')
    ? tabParam
    : 'geral') as Tab

  const { data: settingsRaw } = await supabase.from('settings').select('*').single()
  const settings = settingsRaw as (Settings & {
    geo_enabled?: boolean; geo_lat?: number; geo_lng?: number; geo_radius_meters?: number
  }) | null

  const geoConfig = settings ? {
    id: settings.id,
    geo_enabled: settings.geo_enabled ?? false,
    geo_lat: settings.geo_lat ?? -17.485672,
    geo_lng: settings.geo_lng ?? -48.2130547,
    geo_radius_meters: settings.geo_radius_meters ?? 150,
  } : null

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'geral',       label: 'Geral',        icon: <SettingsIcon size={14} /> },
    { key: 'integracoes', label: 'Integrações',   icon: <Plug size={14} /> },
    { key: 'seguranca',   label: 'Segurança',     icon: <Shield size={14} /> },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── TopAppBar ──────────────────────────────── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
            Configurações
          </h2>
        </header>
      </FadeIn>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <FadeIn delay={0.04}>
          <div className="mb-8">
            <h3 className="text-3xl font-semibold" style={{ color: 'var(--text)' }}>
              Configuração Geral
            </h3>
            <p className="text-base mt-1 preserve-case" style={{ color: 'var(--text-3)' }}>
              Ajuste os parâmetros do sistema Chronos Lab.
            </p>
          </div>
        </FadeIn>

        {/* Tab nav */}
        <FadeIn delay={0.08}>
          <div className="flex gap-2 mb-6">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={`/admin/settings?tab=${t.key}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={activeTab === t.key
                  ? { background: '#00c853', color: '#003912' }
                  : { background: 'var(--surface-card, #0f2318)', color: 'var(--text-3)', border: '1px solid rgba(0,200,83,0.15)' }
                }
              >
                <span className="flex-shrink-0">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
        </FadeIn>

        {/* Content */}
        <FadeIn delay={0.12}>
          <div
            className="rounded-xl p-6"
            style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
          >
            {activeTab === 'geral' && (
              <div>
                <h4 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  Configurações do Laboratório
                </h4>
                <p className="text-sm mb-6 preserve-case" style={{ color: 'var(--text-3)' }}>
                  Horários de lembrete, horas esperadas e e-mail de relatório.
                </p>
                <SettingsForm settings={settings} />
              </div>
            )}

            {activeTab === 'integracoes' && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Plug size={16} style={{ color: 'var(--primary)' }} />
                  <h4 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                    Integrações e Stacks
                  </h4>
                </div>
                <p className="text-sm mb-6 preserve-case" style={{ color: 'var(--text-3)' }}>
                  Status em tempo real dos serviços e dependências do sistema.
                </p>
                <IntegrationsTab />
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div>
                <h4 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  PIN de Acesso Rápido
                </h4>
                <p className="text-sm mb-6 preserve-case" style={{ color: 'var(--text-3)' }}>
                  O PIN permite que você entre no sistema sem digitar e-mail e senha.
                </p>
                <ChangePinForm userId={user.id} />
              </div>
            )}
          </div>
        </FadeIn>

      </div>
    </div>
  )
}
