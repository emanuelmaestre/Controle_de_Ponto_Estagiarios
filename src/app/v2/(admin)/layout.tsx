import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/infra/supabase/server'
import { createContainer } from '@/infra/container'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/v2/login')

  const container = createContainer(supabase)
  const profile = await container.repos.user.findById(user.id)

  if (!profile || !profile.isManager) redirect('/v2/dashboard')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Admin Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-bold text-green-400">ChronosLab Admin</h1>
          <div className="hidden md:flex gap-4">
            <a href="/v2/admin" className="text-sm text-gray-300 hover:text-white">Painel</a>
            <a href="/v2/admin/interns" className="text-sm text-gray-300 hover:text-white">Estagiarios</a>
            <a href="/v2/admin/reports" className="text-sm text-gray-300 hover:text-white">Relatorios</a>
            <a href="/v2/admin/settings" className="text-sm text-gray-300 hover:text-white">Configuracoes</a>
          </div>
        </div>
        <a href="/api/auth/logout" className="text-sm text-gray-500 hover:text-red-400">Sair</a>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
