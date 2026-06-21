import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { requireManager } from '@/lib/route-auth'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api.admin.sync-profiles')

export async function POST() {
  try {
    const auth = await requireManager()
    if (!auth.ok) return auth.response

    const admin = createSupabaseServiceClient()
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id, full_name, nickname, course, email')

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })

    const results: Array<{ email: string; status: string }> = []

    for (const profile of profiles ?? []) {
      try {
        const { error } = await admin.auth.admin.updateUserById(profile.id, {
          user_metadata: {
            full_name: profile.full_name,
            nickname: profile.nickname ?? null,
            course: profile.course ?? null,
          },
        })

        results.push({
          email: profile.email,
          status: error ? `erro: ${error.message}` : 'ok',
        })
      } catch (error) {
        results.push({ email: profile.email, status: `excecao: ${String(error)}` })
      }
    }

    const ok = results.filter(result => result.status === 'ok').length
    const errs = results.filter(result => result.status !== 'ok').length

    return NextResponse.json({ ok: true, synced: ok, errors: errs, results })
  } catch (err) {
    logger.error('request failed', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
