import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

// Endpoint de diagnóstico temporário — comparar o que cada cliente enxerga.
export async function GET() {
  const result: Record<string, unknown> = {}

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    result.auth_user_id = user?.id ?? null
    result.auth_user_email = user?.email ?? null

    if (!user) {
      result.error = 'não autenticado'
      return NextResponse.json(result)
    }

    // 1) Leitura com cliente autenticado (respeita RLS)
    const { data: byIdAuth, error: byIdAuthErr } = await supabase
      .from('profiles').select('id, full_name, email').eq('id', user.id).maybeSingle()
    result.authClient_byId = byIdAuth ?? null
    result.authClient_byId_error = byIdAuthErr?.message ?? null

    // 2) Service role configurado?
    result.service_key_present = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    result.service_key_length = process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0
    result.supabase_url_present = !!process.env.NEXT_PUBLIC_SUPABASE_URL

    // 3) Leitura com service role (ignora RLS)
    try {
      const admin = createSupabaseServiceClient()
      const { data: byIdAdmin, error: byIdAdminErr } = await admin
        .from('profiles').select('id, full_name, email').eq('id', user.id).maybeSingle()
      result.adminClient_byId = byIdAdmin ?? null
      result.adminClient_byId_error = byIdAdminErr?.message ?? null

      const { data: byEmailAdmin, error: byEmailAdminErr } = await admin
        .from('profiles').select('id, full_name, email').eq('email', user.email!).maybeSingle()
      result.adminClient_byEmail = byEmailAdmin ?? null
      result.adminClient_byEmail_error = byEmailAdminErr?.message ?? null

      // Conta total de profiles que o service role consegue ler
      const { count, error: countErr } = await admin
        .from('profiles').select('*', { count: 'exact', head: true })
      result.adminClient_total_profiles = count ?? null
      result.adminClient_count_error = countErr?.message ?? null
    } catch (e) {
      result.adminClient_exception = e instanceof Error ? e.message : String(e)
    }

    return NextResponse.json(result)
  } catch (err) {
    result.fatal = err instanceof Error ? err.message : String(err)
    return NextResponse.json(result, { status: 500 })
  }
}
