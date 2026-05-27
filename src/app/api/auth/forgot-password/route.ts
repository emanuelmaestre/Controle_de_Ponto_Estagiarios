import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${siteUrl}/set-password`,
    })

    if (error) {
      console.error('[forgot-password]', error.message)
      // Não revelar se o e-mail existe ou não — responder sempre com sucesso
    }

    // Sempre retornar sucesso para não vazar se o e-mail existe
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password] unexpected error', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
