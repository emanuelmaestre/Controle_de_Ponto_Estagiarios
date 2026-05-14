import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { minutesToHours } from '@/lib/utils'
import InternForm from '../InternForm'
import type { Profile, MonthlyHours } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InternDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'intern')
    .single()
  const intern = internRaw as Profile | null
  if (!intern) notFound()

  // Últimos 3 meses de horas
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const { data: hoursRaw } = await supabase
    .from('v_monthly_hours')
    .select('*')
    .eq('intern_id', id)
    .gte('month', threeMonthsAgo.toISOString())
    .order('month', { ascending: false })
  const hours = hoursRaw as MonthlyHours[] | null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/interns" className="text-blue-200 hover:text-white text-sm">← Estagiários</Link>
        <div>
          <h1 className="font-bold text-xl">{intern.full_name}</h1>
          <p className="text-blue-200 text-sm">{intern.email}</p>
        </div>
        <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full border ${
          intern.is_active
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          {intern.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Resumo de horas */}
        {hours && hours.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Horas registradas</h2>
            <div className="space-y-3">
              {hours.map(h => (
                <div key={h.month} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">
                    {new Date(h.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  </span>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-gray-400 text-xs">{h.total_sessions} sessões</span>
                    <span className="font-bold text-blue-900 w-16 text-right">{minutesToHours(h.total_minutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulário de edição */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Dados cadastrais</h2>
          <InternForm mode="edit" intern={intern} />
        </div>
      </main>
    </div>
  )
}
