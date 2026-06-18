import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { current_password, new_password } = await request.json()

  if (!current_password || !new_password) {
    return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 })
  }
  if (new_password.length < 6) {
    return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  // Verifica a senha atual tentando fazer login
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  })
  if (signInError) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 })
  }

  // Atualiza para a nova senha
  const { error: updateError } = await supabase.auth.updateUser({ password: new_password })
  if (updateError) {
    return NextResponse.json({ error: 'Erro ao alterar senha. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
