import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabaseAdmin = createSupabaseServiceClient()
  const results: string[] = []

  // Limpar registros
  await supabaseAdmin.from('activities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  results.push('activities cleared')
  await supabaseAdmin.from('time_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  results.push('time_records cleared')

  // Buscar TODOS profiles que NÃO são admin (manager) para listar
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, full_name')

  // Deletar profiles de teste (sem nome ou com email genérico)
  const testEmails = ['seuemail@exemplo.com', 'emanuelmaestree@gmail.com']

  for (const p of profiles ?? []) {
    const emailLower = (p.email ?? '').toLowerCase()
    const isTest = testEmails.includes(emailLower) ||
                   emailLower.includes('exemplo.com') ||
                   (!p.full_name && p.role === 'intern')

    if (isTest) {
      await supabaseAdmin.from('profiles').delete().eq('id', p.id)
      await supabaseAdmin.auth.admin.deleteUser(p.id)
      results.push(`deleted: ${p.email} (${p.full_name || 'sem nome'})`)
    } else {
      results.push(`kept: ${p.email} (${p.role})`)
    }
  }

  return NextResponse.json({ ok: true, results })
}
