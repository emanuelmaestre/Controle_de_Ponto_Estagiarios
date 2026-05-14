import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours, formatTime } from '@/lib/utils'
import type { TodayStatus } from '@/types/database'

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Status de todos os estagiários hoje
  const { data: internsRaw } = await supabase
    .from('v_today_status')
    .select('*')
    .order('full_name')
  const interns = internsRaw as import('@/types/database').TodayStatus[] | null

  // Total de pendências
  const totalPending = interns?.reduce((acc, i) => acc + (i.pending_count ?? 0), 0) ?? 0

  const statusColor: Record<string, string> = {
    ativo:   'bg-green-100 text-green-700 border-green-200',
    saiu:    'bg-blue-50 text-blue-700 border-blue-200',
    ausente: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  const statusLabel: Record<string, string> = {
    ativo: 'No laboratório',
    saiu: 'Saiu hoje',
    ausente: 'Ausente hoje',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl">Painel do Chefe</h1>
          <p className="text-blue-200 text-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {totalPending > 0 && (
            <Link href="/admin/approvals"
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-full font-medium transition-colors">
              <span>⏳</span>
              <span>{totalPending} pendente{totalPending > 1 ? 's' : ''}</span>
            </Link>
          )}
          <Link href="/admin/interns" className="text-blue-200 hover:text-white">Estagiários</Link>
          <Link href="/admin/reports" className="text-blue-200 hover:text-white">Relatórios</Link>
          <Link href="/admin/settings" className="text-blue-200 hover:text-white">Config</Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Resumo rápido */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">No laboratório</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {interns?.filter((i) => i.today_status === 'ativo').length ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Estagiários ativos</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{interns?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pendentes</p>
            <p className={`text-3xl font-bold mt-1 ${totalPending > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {totalPending}
            </p>
          </div>
        </div>

        {/* Grid de estagiários */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {interns?.map((intern) => (
            <Link
              key={intern.id}
              href={`/admin/interns/${intern.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4"
            >
              <div className="flex items-start gap-3">
                {intern.photo_url ? (
                  <img
                    src={intern.photo_url}
                    alt={intern.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-sm">
                    {intern.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{intern.full_name}</p>
                  <span className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[intern.today_status]}`}>
                    {statusLabel[intern.today_status]}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <div>
                  <p className="text-xs text-gray-400">Hoje</p>
                  <p className="font-semibold text-gray-700">{minutesToHours(intern.today_minutes)}</p>
                </div>
                {intern.today_status === 'ativo' && intern.clock_in && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Entrada</p>
                    <p className="font-semibold text-green-600">{formatTime(intern.clock_in)}</p>
                  </div>
                )}
                {intern.pending_count > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-amber-500 font-medium">
                      {intern.pending_count} pendente{intern.pending_count > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {(!interns || interns.length === 0) && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">Nenhum estagiário cadastrado ainda.</p>
            <Link href="/admin/interns/new"
              className="mt-4 inline-block px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
              Cadastrar estagiário
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
