import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()
  const results: string[] = []

  // 1. Limpar registros de ponto e atividades
  await supabaseAdmin.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  results.push('activities cleared')

  await supabaseAdmin.from('time_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  results.push('time_records cleared')

  // 2. Buscar os 2 usuários de teste para remover
  const emails = ['seuemail@exemplo.com', 'emanuelmaestree@gmail.com']

  for (const email of emails) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profile) {
      // Remover profile
      await supabaseAdmin.from('profiles').delete().eq('id', profile.id)
      // Remover do auth
      await supabaseAdmin.auth.admin.deleteUser(profile.id)
      results.push(`deleted: ${email}`)
    } else {
      results.push(`not found: ${email}`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
