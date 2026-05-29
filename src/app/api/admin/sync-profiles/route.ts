import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

// Sincroniza user_metadata do Supabase Auth → profiles
// Preenche campos vazios no profile com os dados do auth user
// Roda uma vez para corrigir perfis criados antes do salvamento de metadados
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createSupabaseServiceClient()

    // Verifica se é manager
    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (me?.role !== 'manager') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

    // Lista todos os auth users
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (!authUsers) return NextResponse.json({ error: 'Falha ao listar usuários' }, { status: 500 })

    // Lista todos os profiles
    const { data: profiles } = await admin.from('profiles').select('id, full_name, course, nickname, email')
    const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

    const results: Array<{ email: string; action: string }> = []

    for (const authUser of authUsers.users) {
      const profile = profileMap.get(authUser.id)
      const meta = authUser.user_metadata ?? {}
      const email = authUser.email ?? ''

      if (!profile) {
        // Perfil não existe — cria com dados do auth
        const name = meta.full_name || email.split('@')[0]
        await admin.from('profiles').insert({
          id: authUser.id,
          email,
          full_name: name,
          nickname: meta.nickname || null,
          course: meta.course || null,
          role: 'intern',
          is_active: true,
          internship_start: new Date().toISOString().slice(0, 10),
        })
        results.push({ email, action: 'created' })
        continue
      }

      // Perfil existe — atualiza campos vazios com dados do auth
      const updates: { full_name?: string; course?: string | null; nickname?: string | null } = {}

      // Nome: substitui só se parece ser um fallback (sem espaço = nome incompleto)
      const nameIsFallback = !profile.full_name.includes(' ')
      if (nameIsFallback && meta.full_name && meta.full_name.includes(' ')) {
        updates.full_name = meta.full_name
      }

      if (!profile.course && meta.course) updates.course = meta.course
      if (!profile.nickname && meta.nickname) updates.nickname = meta.nickname

      if (Object.keys(updates).length > 0) {
        await admin.from('profiles').update(updates).eq('id', authUser.id)
        results.push({ email, action: `updated: ${Object.keys(updates).join(', ')}` })
      } else {
        results.push({ email, action: 'ok' })
      }
    }

    return NextResponse.json({ ok: true, total: results.length, results })
  } catch (err) {
    console.error('[sync-profiles]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
