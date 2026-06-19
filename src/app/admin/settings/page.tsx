import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Settings } from '@/types/database'
import SettingsForm from './SettingsForm'
import ChangePinForm from './ChangePinForm'
import IntegrationsTab from './IntegrationsTab'
import NormalizeNamesButton from './NormalizeNamesButton'
import FixStartDatesButton from './FixStartDatesButton'
import SyncProfilesButton from './SyncProfilesButton'
import RecalcGamificationButton from './RecalcGamificationButton'
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'geral',       label: 'Geral'       },
    { key: 'integracoes', label: 'Integrações'  },
    { key: 'seguranca',   label: 'Segurança'    },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: 'var(--bg)' }}>

      {/* ── TopAppBar ── */}
      <FadeIn delay={0}>
        <header
          className="flex items-center justify-between px-6 h-16 flex-shrink-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid rgba(0,200,83,0.15)' }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Configurações</h2>
        </header>
      </FadeIn>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
        <div style={{ maxWidth: 940, margin: '0 auto' }}>

          {/* Page heading */}
          <FadeIn delay={0.04}>
            <div className="mb-8">
              <h3 className="text-3xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Configuração Geral</h3>
              <p className="text-base" style={{ color: 'var(--text-3)' }}>
                Gerencie os parâmetros operacionais do laboratório e as notificações automatizadas.
              </p>
            </div>
          </FadeIn>

          {/* ── Underline tabs ── */}
          <FadeIn delay={0.06}>
            <div className="flex gap-4 sm:gap-8 mb-8 overflow-x-auto" style={{ borderBottom: '1px solid rgba(0,200,83,0.15)' }}>
              {tabs.map(t => (
                <Link
                  key={t.key}
                  href={`/admin/settings?tab=${t.key}`}
                  className="text-sm font-semibold transition-colors pb-4 inline-block"
                  style={activeTab === t.key
                    ? { color: '#3fe56c', borderBottom: '2px solid #3fe56c', marginBottom: -1 }
                    : { color: 'var(--text-3)' }
                  }
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </FadeIn>

          {/* ── Tab content ── */}
          <FadeIn delay={0.1}>

            {/* ══ GERAL ══ */}
            {activeTab === 'geral' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Form — 8 cols */}
                <div className="md:col-span-8">
                  <div
                    className="rounded-xl p-6"
                    style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                  >
                    <SettingsForm settings={settings} />
                  </div>
                </div>

                {/* Sidebar — 4 cols */}
                <div className="md:col-span-4">
                  <div
                    className="rounded-xl p-5 space-y-3"
                    style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
                  >
                    <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
                      UTILITÁRIOS
                    </p>
                    <NormalizeNamesButton />
                    <FixStartDatesButton />
                    <SyncProfilesButton />
                    <RecalcGamificationButton />
                  </div>
                </div>
              </div>
            )}

            {/* ══ INTEGRAÇÕES ══ */}
            {activeTab === 'integracoes' && (
              <IntegrationsTab />
            )}

            {/* ══ SEGURANÇA ══ */}
            {activeTab === 'seguranca' && (
              <div
                className="rounded-xl p-6"
                style={{ background: 'var(--surface-card, #0f2318)', border: '1px solid rgba(0,200,83,0.15)' }}
              >
                <h4 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  PIN de Acesso Rápido
                </h4>
                <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
                  O PIN permite que você entre no sistema sem digitar e-mail e senha.
                </p>
                <ChangePinForm userId={user.id} />
              </div>
            )}

          </FadeIn>
        </div>
      </div>
    </div>
  )
}
