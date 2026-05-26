import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Settings } from '@/types/database'
import SettingsForm from './SettingsForm'
import ChangePinForm from './ChangePinForm'
import GeoSettings from './GeoSettings'
import AdminNav from '@/components/AdminNav'
import { FadeIn } from '@/components/ui/MotionWrappers'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settingsRaw } = await supabase
    .from('settings')
    .select('*')
    .single()
  const settings = settingsRaw as (Settings & {
    geo_enabled?: boolean
    geo_lat?: number
    geo_lng?: number
    geo_radius_meters?: number
  }) | null

  const geoConfig = settings ? {
    id: settings.id,
    geo_enabled: settings.geo_enabled ?? false,
    geo_lat: settings.geo_lat ?? -17.485672,
    geo_lng: settings.geo_lng ?? -48.2130547,
    geo_radius_meters: settings.geo_radius_meters ?? 150,
  } : null

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'var(--bg)' }}>
      <AdminNav />

      {/* Page header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/admin" className="text-sm transition-colors hover:opacity-70" style={{ color: 'var(--text-3)' }}>
            ← Painel
          </Link>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Configurações</h1>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Ajustes do sistema</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Configurações gerais */}
        <FadeIn delay={0}>
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Configurações do laboratório
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              Horários de lembrete, horas esperadas e e-mail de relatório.
            </p>
            <SettingsForm settings={settings} />
          </div>
        </FadeIn>

        {/* Geolocalização */}
        <FadeIn delay={0.08}>
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} style={{ color: 'var(--primary)' }} />
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
                Controle de localização
              </h2>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              Exige que os estagiários estejam fisicamente no laboratório para registrar o ponto.
            </p>
            <GeoSettings config={geoConfig} />
          </div>
        </FadeIn>

        {/* Alterar PIN */}
        <FadeIn delay={0.16}>
          <div
            className="rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Seu PIN de acesso rápido
            </h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
              O PIN permite que você entre no sistema sem digitar e-mail e senha.
            </p>
            <ChangePinForm userId={user.id} />
          </div>
        </FadeIn>
      </main>
    </div>
  )
}
