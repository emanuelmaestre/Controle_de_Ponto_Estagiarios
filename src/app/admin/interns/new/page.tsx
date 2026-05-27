import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import InternForm from '../InternForm'
import { FadeIn } from '@/components/ui/MotionWrappers'

export const dynamic = 'force-dynamic'

export default async function NewInternPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'var(--bg)' }}>


      {/* Header compacto */}
      <div className="flex-shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/admin/interns" className="text-sm font-bold hover:opacity-70" style={{ color: 'var(--text-3)' }}>
            &larr; ESTAGIARIOS
          </Link>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />
          <div>
            <h1 className="font-bold text-sm" style={{ color: 'var(--text)' }}>CADASTRAR ESTAGIARIO</h1>
            <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>PREENCHA OS DADOS DO NOVO MEMBRO</p>
          </div>
        </div>
      </div>

      {/* Form area - scrollavel internamente sem barra visivel */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <FadeIn>
            <InternForm mode="create" />
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
