import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verificar que é manager
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await authClient
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'manager') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { intern_id, action, new_password } = await request.json()
  const supabaseAdmin = createSupabaseServiceClient()

  // Buscar e-mail do estagiário
  const { data: intern } = await supabaseAdmin
    .from('profiles').select('email').eq('id', intern_id).single()
  if (!intern) return NextResponse.json({ error: 'Estagiário não encontrado' }, { status: 404 })

  if (action === 'send_reset_email') {
    // Enviar e-mail de redefinição de senha
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(intern.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://controle-de-ponto-estagiarios.vercel.app'}/set-password`,
    })
    if (error) return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'E-mail de redefinição enviado.' })
  }

  if (action === 'set_password') {
    // Admin define nova senha diretamente
    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(intern_id, {
      password: new_password,
    })
    if (error) return NextResponse.json({ error: 'Erro ao alterar senha.' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso.' })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
