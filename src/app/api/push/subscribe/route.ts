import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { endpoint, p256dh, auth, userAgent } = await request.json()
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Upsert: evita duplicatas por endpoint
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, endpoint, p256dh, auth, user_agent: userAgent ?? null },
        { onConflict: 'endpoint' },
      )

    if (error) return NextResponse.json({ error: 'Erro ao salvar subscription.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
