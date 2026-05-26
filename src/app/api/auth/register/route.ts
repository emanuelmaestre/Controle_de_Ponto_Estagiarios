import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { full_name, nickname, email, course, password } = await request.json()

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseServiceClient()

    // Verificar se email já existe
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Criar profile como intern INATIVO (precisa aprovação do admin)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      full_name,
      nickname: nickname || null,
      email: email.toLowerCase(),
      course: course || null,
      role: 'intern',
      is_active: true,
    }, { onConflict: 'id' })

    if (profileError) {
      // Rollback: deletar auth user se profile falhar
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Cadastro realizado!' })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
