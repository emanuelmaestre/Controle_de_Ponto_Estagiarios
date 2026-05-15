import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import ReportExport from './ReportExport'
import MonthSelector from './MonthSelector'
import type { Profile, MonthlyHours } from '@/types/database'

interface SearchParams {
  month?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function ReportsPage({ searchParams }: Props) {
  const { month } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Mês selecionado (padrão: mês atual)
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, mon] = selectedMonth.split('-').map(Number)
  const monthStart = new Date(Date.UTC(year, mon - 1, 1)).toISOString()
  const monthEnd = new Date(Date.UTC(year, mon, 1)).toISOString()

  // Estagiários ativos
  const { data: internsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, course')
    .eq('role', 'intern')
    .eq('is_active', true)
    .order('full_name')
  const interns = internsRaw as Pick<Profile, 'id' | 'full_name' | 'email' | 'course'>[] | null

  // Horas do mês para cada estagiário
  const { data: hoursRaw } = await supabase
    .from('v_monthly_hours')
    .select('*')
    .gte('month', monthStart)
    .lt('month', monthEnd)
  const hours = hoursRaw as MonthlyHours[] | null

  // Indexar horas por intern_id
  const hoursMap = new Map(hours?.map(h => [h.intern_id, h]) ?? [])

  // Gerar opções dos últimos 12 meses
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  })

  // Totais gerais
  const totalMinutes = hours?.reduce((acc, h) => acc + h.total_minutes, 0) ?? 0
  const totalSessions = hours?.reduce((acc, h) => acc + h.total_sessions, 0) ?? 0

  // Construir dados do relatório para exportação
  const reportData = interns?.map(intern => {
    const h = hoursMap.get(intern.id)
    return {
      nome: intern.full_name,
      email: intern.email,
      curso: intern.course ?? '',
      total_horas: h ? minutesToHours(h.total_minutes) : '0h',
      sessoes: h?.total_sessions ?? 0,
      aprovados: h?.approved_sessions ?? 0,
      pendentes: h?.pending_sessions ?? 0,
      reprovados: h?.rejected_sessions ?? 0,
    }
  }) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@media print { header { display: none !important; } .print\\:hidden { display: none !important; } body { background: white !important; } nav { display: none !important; } }`}</style>
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-blue-200 hover:text-white text-sm">← Painel</Link>
          <div>
            <h1 className="font-bold text-xl">Relatórios</h1>
            <p className="text-blue-200 text-sm">Horas por estagiário</p>
          </div>
        </div>
        <ReportExport data={reportData} month={selectedMonth} monthLabel={monthOptions.find(o => o.value === selectedMonth)?.label ?? selectedMonth} />
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Seletor de mês */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-600">Período:</label>
          <MonthSelector selectedMonth={selectedMonth} options={monthOptions} />
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total de horas</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{minutesToHours(totalMinutes)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Sessões aprovadas</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {hours?.reduce((acc, h) => acc + h.approved_sessions, 0) ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total de sessões</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{totalSessions}</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estagiário</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sessões</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-green-600 uppercase tracking-wide">Aprov.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-amber-500 uppercase tracking-wide">Pend.</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-red-500 uppercase tracking-wide">Reprov.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {interns?.map(intern => {
                const h = hoursMap.get(intern.id)
                return (
                  <tr key={intern.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{intern.full_name}</p>
                      {intern.course && <p className="text-xs text-gray-400">{intern.course}</p>}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-blue-900">
                      {h ? minutesToHours(h.total_minutes) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600">{h?.total_sessions ?? 0}</td>
                    <td className="px-4 py-4 text-center text-green-600 font-medium">{h?.approved_sessions ?? 0}</td>
                    <td className="px-4 py-4 text-center text-amber-500 font-medium">{h?.pending_sessions ?? 0}</td>
                    <td className="px-4 py-4 text-center text-red-500 font-medium">{h?.rejected_sessions ?? 0}</td>
                  </tr>
                )
              })}
              {(!interns || interns.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Nenhum estagiário ativo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
