import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatTime } from '@/lib/utils'
import CheckoutForm from './CheckoutForm'

interface Props {
  searchParams: Promise<{ record?: string }>
}

export default async function CheckoutPage({ searchParams }: Props) {
  const { record: recordId } = await searchParams
  if (!recordId) redirect('/dashboard')

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar se o registro pertence ao estagiário e está aberto
  const { data: record } = await supabase
    .from('time_records')
    .select('id, clock_in, intern_id')
    .eq('id', recordId)
    .eq('intern_id', user.id)
    .is('clock_out', null)
    .single()

  if (!record) redirect('/dashboard')

  // Buscar atividades favoritas (ordenadas por uso)
  const { data: favorites } = await supabase
    .from('favorite_activities')
    .select('id, description, use_count')
    .eq('intern_id', user.id)
    .order('use_count', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-4 py-4">
        <h1 className="font-bold text-lg">Registrar Saída</h1>
        <p className="text-blue-200 text-sm mt-0.5">
          Entrada às {formatTime(record.clock_in)}
        </p>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <CheckoutForm
          recordId={record.id}
          clockIn={record.clock_in}
          favorites={favorites ?? []}
        />
      </main>
    </div>
  )
}
