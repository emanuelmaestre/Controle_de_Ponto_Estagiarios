import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// Rota temporária — remover após uso
export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()

  // UUID do Milton obtido diretamente do banco
  const miltonId = 'caf3242d-85ed-4767-9af0-2abf74d9d5ca'

  // Definir senha diretamente pelo ID
  const { error } = await supabaseAdmin.auth.admin.updateUserById(miltonId, {
    password: 'Milton157@',
    email: 'milton@chronoslab.com.br',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Garantir profile como manager ativo
  await supabaseAdmin
    .from('profiles')
    .update({ role: 'manager', is_active: true })
    .eq('id', miltonId)

  return NextResponse.json({ ok: true, message: 'Senha do Milton redefinida com sucesso!' })
}
