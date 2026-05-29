import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

// Sincroniza dados dos profiles → user_metadata do Supabase Auth
// para TODOS os usuários existentes.
// Garante que se um profile for deletado, o ensureProfile consegue
// recuperar os dados corretos do cadastro original.
// Deve ser chamado uma vez pelo admin após o deploy.
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createSupabaseServiceClient()

    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (me?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    // Busca todos os profiles com dados completos
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id, full_name, nickname, course, email')
    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })

    const results: Array<{ email: string; status: string }> = []

    for (const profile of profiles ?? []) {
      try {
        // Atualiza user_metadata no Supabase Auth com os dados do profile
        const { error } = await admin.auth.admin.updateUserById(profile.id, {
          user_metadata: {
            full_name: profile.full_name,
            nickname: profile.nickname ?? null,
            course: profile.course ?? null,
          },
        })
        results.push({
          email: profile.email,
          status: error ? `erro: ${error.message}` : 'ok',
        })
      } catch (e) {
        results.push({ email: profile.email, status: `exceção: ${e}` })
      }
    }

    const ok = results.filter(r => r.status === 'ok').length
    const errs = results.filter(r => r.status !== 'ok').length

    return NextResponse.json({ ok: true, synced: ok, errors: errs, results })
  } catch (err) {
    console.error('[sync-profiles]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
