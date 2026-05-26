import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()
  const miltonId = 'ce303f32-5c42-4255-a582-a137b8cf87aa'
  const newEmail = 'milton.lima@ifgoiano.edu.br'

  // Atualizar email e senha no auth
  const { error } = await supabaseAdmin.auth.admin.updateUserById(miltonId, {
    email: newEmail,
    password: 'Milton157@',
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Atualizar profile
  await supabaseAdmin.from('profiles').update({
    email: newEmail,
    role: 'manager',
    is_active: true,
  }).eq('id', miltonId)

  return NextResponse.json({ ok: true, message: 'Milton atualizado para ' + newEmail })
}
