import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// Rota temporária — remover após uso
export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()

  // Criar usuário do Milton no auth (com confirmação de email automática)
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'milton@chronoslab.com.br',
    password: 'Milton157@',
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message, hint: 'Se já existe, tente o endpoint /fix-milton-update' }, { status: 500 })
  }

  const userId = data.user.id

  // Atualizar (ou criar) profile como manager
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    full_name: 'Milton',
    email: 'milton@chronoslab.com.br',
    role: 'manager',
    is_active: true,
  }, { onConflict: 'id' })

  return NextResponse.json({ ok: true, message: 'Milton criado com sucesso!', userId })
}
