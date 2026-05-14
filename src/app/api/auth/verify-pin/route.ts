import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import type { Database } from '@/types/database'

// Route Handler: verificar PIN e criar sessão
// PIN nunca sai do servidor — nunca expor ao cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, pin } = body

    // Validação básica
    if (!email || !pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Cliente com service role para buscar o hash sem restrições de RLS
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Buscar perfil pelo e-mail
    const { data: profileRaw, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, pin, is_active, role')
      .eq('email', email.toLowerCase())
      .single()
    const profile = profileRaw as { id: string; pin: string | null; is_active: boolean; role: string } | null

    if (profileError || !profile) {
      // Não revelar se o e-mail existe ou não (segurança)
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: 'Conta desativada.' }, { status: 403 })
    }

    if (!profile.pin) {
      return NextResponse.json({ error: 'PIN não configurado. Use e-mail e senha.' }, { status: 400 })
    }

    // Verificar PIN com bcrypt (delay intencional de ~300ms)
    const isValid = await bcrypt.compare(pin, profile.pin)
    if (!isValid) {
      return NextResponse.json({ error: 'PIN incorreto.' }, { status: 401 })
    }

    // Gerar magic link e extrair token para criar sessão sem expor a senha
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Erro ao criar sessão.' }, { status: 500 })
    }

    // Verificar OTP para obter sessão real
    const { data: { session }, error: verifyError } =
      await supabaseAdmin.auth.verifyOtp({
        email: email.toLowerCase(),
        token: linkData.properties.hashed_token,
        type: 'magiclink',
      })

    if (verifyError || !session) {
      return NextResponse.json({ error: 'Erro ao iniciar sessão.' }, { status: 500 })
    }

    // Retornar os tokens para o cliente setar nos cookies via @supabase/ssr
    const response = NextResponse.json({ success: true, role: profile.role })

    // Setar cookies de sessão seguros
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    }

    response.cookies.set('sb-access-token', session.access_token, cookieOptions)
    response.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions)

    return response
  } catch (err) {
    console.error('[verify-pin]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
