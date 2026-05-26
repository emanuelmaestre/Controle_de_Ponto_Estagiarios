import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Settings } from '@/types/database'
import SettingsForm from './SettingsForm'
import ChangePinForm from './ChangePinForm'
import GeoSettings from './GeoSettings'
import IntegrationsTab from './IntegrationsTab'
import AdminNav from '@/components/AdminNav'
import { Settings as SettingsIcon, MapPin, Plug, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Tab = 'geral' | 'localizacao' | 'integracoes' | 'seguranca'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab: tabParam } = await searchParams
  const activeTab = (['geral', 'localizacao', 'integracoes', 'seguranca'].includes(tabParam ?? '')
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
    { key: 'localizacao', label: 'LOCALIZACAO',  icon: <MapPin size={14} /> },
    { key: 'integracoes', label: 'INTEGRACOES',  icon: <Plug size={14} /> },
    { key: 'seguranca',   label: 'SEGURANCA',    icon: <Shield size={14} /> },
  ]

  return (
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <AdminNav />

      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-3)' }}>
              &larr; PAINEL
            </Link>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>CONFIGURACOES</h1>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>AJUSTES DO SISTEMA</p>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map(t => (
              <Link
                key={t.key}
                href={`/admin/settings?tab=${t.key}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                style={activeTab === t.key
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                }
              >
                {t.icon} {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}><div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        {activeTab === 'geral' && (
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>CONFIGURACOES DO LABORATORIO</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>HORARIOS DE LEMBRETE, HORAS ESPERADAS E E-MAIL DE RELATORIO.</p>
            <SettingsForm settings={settings} />
          </div>
        )}

        {activeTab === 'localizacao' && (
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>CONTROLE DE LOCALIZACAO</h2>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              EXIGE QUE OS ESTAGIARIOS ESTEJAM FISICAMENTE NO LABORATORIO PARA REGISTRAR O PONTO.
            </p>
            <GeoSettings config={geoConfig} />
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Plug size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>INTEGRACOES E STACKS</h2>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              STATUS EM TEMPO REAL DOS SERVICOS E DEPENDENCIAS DO SISTEMA.
            </p>
            <IntegrationsTab />
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>SEU PIN DE ACESSO RAPIDO</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              O PIN PERMITE QUE VOCE ENTRE NO SISTEMA SEM DIGITAR E-MAIL E SENHA.
            </p>
            <ChangePinForm userId={user.id} />
          </div>
        )}
      </div></main>
    </div>
  )
}

