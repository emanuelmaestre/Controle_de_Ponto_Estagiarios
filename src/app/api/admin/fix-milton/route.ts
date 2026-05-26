import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// Rota temporária — remover após uso
export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()

  // Buscar usuário pelo email diretamente
  const { data, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return NextResponse.json({ error: listError.message, detail: 'listUsers failed' }, { status: 500 })

  const milton = data.users.find((u: { email?: string }) => u.email === 'milton@chronoslab.com.br')
  if (!milton) {
    // Tentar criar se não existir
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'milton@chronoslab.com.br',
      password: 'Milton157@',
      email_confirm: true,
    })
    if (createError) return NextResponse.json({ error: createError.message, detail: 'createUser failed' }, { status: 500 })
    await supabaseAdmin.from('profiles').upsert({ id: created.user.id, role: 'manager', is_active: true, full_name: 'Milton', email: 'milton@chronoslab.com.br' })
    return NextResponse.json({ ok: true, action: 'created', userId: created.user.id })
  }

  // Atualizar senha
  const { error } = await supabaseAdmin.auth.admin.updateUserById(milton.id, { password: 'Milton157@' })
  if (error) return NextResponse.json({ error: error.message, detail: 'updateUser failed' }, { status: 500 })

  await supabaseAdmin.from('profiles').update({ role: 'manager', is_active: true }).eq('id', milton.id)

  return NextResponse.json({ ok: true, action: 'updated', userId: milton.id, email: milton.email })
}
