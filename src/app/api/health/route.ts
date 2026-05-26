import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, { status: 'online' | 'offline' | 'degraded'; latency?: number; detail?: string }> = {}

  // ── Supabase ─────────────────────────────────────────
  const t0 = Date.now()
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('settings').select('id').limit(1).maybeSingle()
    results.supabase = {
      status: error ? 'degraded' : 'online',
      latency: Date.now() - t0,
      detail: error ? error.message : 'Banco de dados operacional',
    }
  } catch {
    results.supabase = { status: 'offline', latency: Date.now() - t0, detail: 'Falha na conexão' }
  }

  // ── Vercel / Deploy ───────────────────────────────────
  results.vercel = {
    status: 'online',
    detail: process.env.VERCEL_ENV ?? 'production',
  }

  // ── Next.js ───────────────────────────────────────────
  results.nextjs = {
    status: 'online',
    detail: process.env.NEXT_RUNTIME ?? 'nodejs',
  }

  // ── GitHub ────────────────────────────────────────────
  const tGH = Date.now()
  try {
    const res = await fetch('https://www.githubstatus.com/api/v2/status.json', {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json() as { status: { indicator: string } }
      results.github = {
        status: json.status.indicator === 'none' ? 'online' : 'degraded',
        latency: Date.now() - tGH,
        detail: json.status.indicator === 'none' ? 'Todos os sistemas operacionais' : 'Degradado',
      }
    } else {
      results.github = { status: 'degraded', latency: Date.now() - tGH }
    }
  } catch {
    results.github = { status: 'offline', latency: Date.now() - tGH, detail: 'Sem resposta' }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    services: results,
  })
}
