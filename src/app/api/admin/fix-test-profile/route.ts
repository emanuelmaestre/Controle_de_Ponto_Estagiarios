import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

// Corrige o perfil de teste do emanuelmaestree@gmail.com com os dados corretos
// e salva nos user_metadata para recuperação futura
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const admin = createSupabaseServiceClient()

    const TARGET_EMAIL = 'emanuelmaestree@gmail.com'
    const CORRECT_DATA = {
      full_name: 'Emanuel Maestre dos Santos',
      course: 'BACHARELADO EM AGRONOMIA',
      nickname: null,
    }

    // Encontra o auth user pelo email
    const { data: authList } = await admin.auth.admin.listUsers()
    const targetUser = authList?.users?.find(u => u.email === TARGET_EMAIL)
    if (!targetUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    // Atualiza user_metadata
    await admin.auth.admin.updateUserById(targetUser.id, {
      user_metadata: CORRECT_DATA,
    })

    // Atualiza profile
    await admin.from('profiles').update(CORRECT_DATA).eq('id', targetUser.id)

    return NextResponse.json({ ok: true, message: 'Perfil corrigido!', data: CORRECT_DATA })
  } catch (err) {
    console.error('[fix-test-profile]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
