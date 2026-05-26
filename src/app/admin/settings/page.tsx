import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Settings } from '@/types/database'
import SettingsForm from './SettingsForm'
import ChangePinForm from './ChangePinForm'
import AdminNav from '@/components/AdminNav'
import { FadeIn } from '@/components/ui/MotionWrappers'

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settingsRaw } = await supabase
    .from('settings')
    .select('*')
    .single()
  const settings = settingsRaw as Settings | null

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <AdminNav />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-2 sm:gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-slate-600 text-sm transition-colors flex-shrink-0">
            â†<span className="hidden sm:inline"> Painel</span>
          </Link>
          <div>
            <h1 className="font-bold text-slate-800 text-lg sm:text-xl">ConfiguraÃ§Ãµes</h1>
            <p className="text-slate-400 text-xs">Ajustes do sistema</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
        {/* ConfiguraÃ§Ãµes gerais */}
        <FadeIn delay={0}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-slate-800 mb-1">ConfiguraÃ§Ãµes do laboratÃ³rio</h2>
            <p className="text-sm text-slate-400 mb-5">HorÃ¡rios de lembrete, horas esperadas e e-mail de relatÃ³rio.</p>
            <SettingsForm settings={settings} />
          </div>
        </FadeIn>

        {/* Alterar PIN */}
        <FadeIn delay={0.1}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Seu PIN de acesso rÃ¡pido</h2>
            <p className="text-sm text-slate-400 mb-5">
              O PIN permite que vocÃª entre no sistema sem digitar e-mail e senha.
            </p>
            <ChangePinForm userId={user.id} />
          </div>
        </FadeIn>
      </main>
    </div>
  )
}

