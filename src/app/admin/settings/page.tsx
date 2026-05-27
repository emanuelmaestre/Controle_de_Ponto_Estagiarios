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
import BackButton from '@/components/ui/BackButton'

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
    { key: 'geral',       label: 'GERAL',        icon: <SettingsIcon size={14} /> },
    { key: 'integracoes', label: 'INTEGRAÇÕES',  icon: <Plug size={14} /> },
    { key: 'seguranca',   label: 'SEGURANÇA',    icon: <Shield size={14} /> },
  ]

  return (
    <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>


      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <BackButton href="/admin" />
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>CONFIGURAÇÕES</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>AJUSTES DO SISTEMA</p>
            </div>
          </div>

          {/* Tab nav — grid fixo, sem scroll lateral */}
          <div className="grid grid-cols-3 gap-1.5">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={`/admin/settings?tab=${t.key}`}
                className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-all text-center"
                style={activeTab === t.key
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                }
              >
                <span className="flex-shrink-0">{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content — ocupa toda a altura restante, sem scroll */}
      <div className="flex-1 min-h-0" style={{ display: 'flex', flexDirection: 'column', padding: '12px 24px' }}>
        <div style={{ maxWidth: 672, margin: '0 auto', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <FadeIn className="flex-1 flex flex-col min-h-0">
            <div className="rounded-2xl p-4 sm:p-5" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface)', border: '1px solid var(--border)' }}>

              {activeTab === 'geral' && (
                <div className="flex flex-col h-full">
                  <h2 className="font-semibold mb-0.5 flex-shrink-0" style={{ color: 'var(--text)' }}>CONFIGURAÇÕES DO LABORATÓRIO</h2>
                  <p className="text-xs mb-4 flex-shrink-0" style={{ color: 'var(--text-3)' }}>HORÁRIOS DE LEMBRETE, HORAS ESPERADAS E E-MAIL DE RELATÓRIO.</p>
                  <SettingsForm settings={settings} />
                </div>
              )}

              {activeTab === 'integracoes' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-0.5 flex-shrink-0">
                    <Plug size={14} style={{ color: 'var(--primary)' }} />
                    <h2 className="font-semibold" style={{ color: 'var(--text)' }}>INTEGRAÇÕES E STACKS</h2>
                  </div>
                  <p className="text-xs mb-3 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                    STATUS EM TEMPO REAL DOS SERVIÇOS E DEPENDÊNCIAS DO SISTEMA.
                  </p>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <IntegrationsTab />
                  </div>
                </div>
              )}

              {activeTab === 'seguranca' && (
                <div className="flex flex-col h-full">
                  <h2 className="font-semibold mb-0.5 flex-shrink-0" style={{ color: 'var(--text)' }}>SEU PIN DE ACESSO RÁPIDO</h2>
                  <p className="text-xs mb-4 flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                    O PIN PERMITE QUE VOCÊ ENTRE NO SISTEMA SEM DIGITAR E-MAIL E SENHA.
                  </p>
                  <ChangePinForm userId={user.id} />
                </div>
              )}

            </div>
          </FadeIn>
          </div>

        </div>
      </div>
    </div>
  )
}

