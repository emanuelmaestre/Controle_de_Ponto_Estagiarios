import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// Rota temporária — remover após uso
export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()

  // Buscar usuário pelo email
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const milton = users.find(u => u.email === 'milton@chronoslab.com.br')
  if (!milton) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  // Definir senha
  const { error } = await supabaseAdmin.auth.admin.updateUserById(milton.id, {
    password: 'Milton157@',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Garantir que o profile está como manager
  await supabaseAdmin.from('profiles').update({ role: 'manager', is_active: true }).eq('id', milton.id)

  return NextResponse.json({ ok: true, userId: milton.id, message: 'Senha redefinida com sucesso!' })
}
