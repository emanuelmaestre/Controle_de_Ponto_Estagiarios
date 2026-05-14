import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import InternForm from '../InternForm'

export default async function NewInternPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/interns" className="text-blue-200 hover:text-white text-sm">← Estagiários</Link>
        <div>
          <h1 className="font-bold text-xl">Cadastrar Estagiário</h1>
          <p className="text-blue-200 text-sm">Preencha os dados do novo membro</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-6">
        <InternForm mode="create" />
      </main>
    </div>
  )
}
