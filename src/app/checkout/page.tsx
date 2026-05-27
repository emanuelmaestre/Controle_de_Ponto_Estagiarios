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

  // Administradores não registram ponto
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role === 'manager') redirect('/admin')

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
    <div className="flex flex-col" style={{ height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <header className="flex-shrink-0" style={{ background: 'var(--nav-bg)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-bold text-base" style={{ color: 'white' }}>REGISTRAR SAÍDA</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Entrada as {formatTime(record.clock_in)}
          </p>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-lg mx-auto p-4">
          <CheckoutForm
            recordId={record.id}
            clockIn={record.clock_in}
            favorites={favorites ?? []}
          />
        </div>
      </main>
    </div>
  )
}
