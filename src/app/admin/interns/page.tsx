import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export default async function InternsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: internsRaw } = await supabase
    .from('profiles')
    .select('id, full_name, email, course, internship_start, internship_end, is_active, role, photo_url')
    .eq('role', 'intern')
    .order('full_name')
  const interns = internsRaw as Pick<Profile,
    'id' | 'full_name' | 'email' | 'course' | 'internship_start' | 'internship_end' | 'is_active' | 'role' | 'photo_url'
  >[] | null

  const active = interns?.filter(i => i.is_active) ?? []
  const inactive = interns?.filter(i => !i.is_active) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-blue-200 hover:text-white text-sm">← Painel</Link>
          <div>
            <h1 className="font-bold text-xl">Estagiários</h1>
            <p className="text-blue-200 text-sm">{active.length} ativo{active.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link
          href="/admin/interns/new"
          className="bg-white text-blue-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          + Cadastrar
        </Link>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Ativos */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ativos ({active.length})
          </h2>
          <div className="space-y-2">
            {active.map(intern => (
              <InternRow key={intern.id} intern={intern} />
            ))}
            {active.length === 0 && (
              <p className="text-gray-400 text-sm py-4 text-center">Nenhum estagiário ativo.</p>
            )}
          </div>
        </section>

        {/* Inativos */}
        {inactive.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Inativos ({inactive.length})
            </h2>
            <div className="space-y-2 opacity-60">
              {inactive.map(intern => (
                <InternRow key={intern.id} intern={intern} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function InternRow({ intern }: {
  intern: Pick<Profile, 'id' | 'full_name' | 'email' | 'course' | 'internship_start' | 'internship_end' | 'is_active' | 'photo_url'>
}) {
  return (
    <Link
      href={`/admin/interns/${intern.id}`}
      className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all px-5 py-4"
    >
      {intern.photo_url ? (
        <img src={intern.photo_url} alt={intern.full_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-sm flex-shrink-0">
          {intern.full_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800">{intern.full_name}</p>
        <p className="text-sm text-gray-400 truncate">{intern.email}</p>
      </div>
      <div className="text-right hidden sm:block">
        {intern.course && <p className="text-sm text-gray-600">{intern.course}</p>}
        {intern.internship_start && (
          <p className="text-xs text-gray-400">
            Desde {new Date(intern.internship_start).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
      <span className="text-gray-300 text-lg">›</span>
    </Link>
  )
}
