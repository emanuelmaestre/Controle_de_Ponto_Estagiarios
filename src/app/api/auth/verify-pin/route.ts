import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createLogger } from '@/lib/logger'
import { pinLoginSchema } from '@/lib/validations'
import type { Database } from '@/types/database'

const INVALID_CREDENTIALS = 'Credenciais invalidas.'
const logger = createLogger('api.auth.verify-pin')

export async function POST(request: NextRequest) {
  try {
    const parsed = pinLoginSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase()
    const pin = parsed.data.pin

    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: profileRaw, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, pin, is_active, role')
      .eq('email', email)
      .single()
    const profile = profileRaw as { id: string; pin: string | null; is_active: boolean; role: string } | null

    if (profileError || !profile || !profile.is_active || !profile.pin) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 })
    }

    const isValid = await bcrypt.compare(pin, profile.pin)
    if (!isValid) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 })
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: 'Erro ao criar sessao.' }, { status: 500 })
    }

    const { data: { session }, error: verifyError } =
      await supabaseAdmin.auth.verifyOtp({
        email,
        token: linkData.properties.hashed_token,
        type: 'magiclink',
      })

    if (verifyError || !session) {
      return NextResponse.json({ error: 'Erro ao iniciar sessao.' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, role: profile.role })
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    }

    response.cookies.set('sb-access-token', session.access_token, cookieOptions)
    response.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions)

    return response
  } catch (err) {
    logger.error('request failed', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
