import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Settings } from '@/types/database'
import SettingsForm from './SettingsForm'
import ChangePinForm from './ChangePinForm'

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-blue-200 hover:text-white text-sm">← Painel</Link>
        <div>
          <h1 className="font-bold text-xl">Configurações</h1>
          <p className="text-blue-200 text-sm">Ajustes do sistema</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Configurações gerais */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Configurações do laboratório</h2>
          <p className="text-sm text-gray-400 mb-5">Horários de lembrete, horas esperadas e e-mail de relatório.</p>
          <SettingsForm settings={settings} />
        </div>

        {/* Alterar PIN */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Seu PIN de acesso rápido</h2>
          <p className="text-sm text-gray-400 mb-5">
            O PIN permite que você entre no sistema sem digitar e-mail e senha.
          </p>
          <ChangePinForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
