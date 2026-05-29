import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { full_name, nickname, email, course, password, photo_url } = await request.json()

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseServiceClient()

    // Verificar se email já existe no profiles
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 409 })
    }

    // Verificar se email existe em auth.users (usuário órfão)
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers()
    const orphanUser = authList?.users?.find(u => u.email === email.toLowerCase())
    if (orphanUser) {
      await supabaseAdmin.auth.admin.deleteUser(orphanUser.id)
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('[register-with-photo] authError:', authError.message)
      return NextResponse.json({ error: `Erro ao criar conta: ${authError.message}` }, { status: 500 })
    }

    // Criar profile com foto_url já preenchida
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      full_name,
      nickname: nickname || null,
      email: email.toLowerCase(),
      course: course || null,
      photo_url: photo_url || null,
      role: 'intern',
      is_active: true,
      internship_start: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'id' })

    if (profileError) {
      // Rollback: deletar auth user se profile falhar
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id, message: 'Cadastro realizado!' })
  } catch (err) {
    console.error('[register-with-photo]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
