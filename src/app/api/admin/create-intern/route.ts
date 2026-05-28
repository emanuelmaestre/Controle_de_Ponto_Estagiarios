import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { internSchema } from '@/lib/validations'
import { formatFullName } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://controle-de-ponto-estagiarios.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const body: Record<string, unknown> = await request.json()
    const parsed = internSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    const data = parsed.data
    const supabaseAdmin = createSupabaseServiceClient()

    // Convidar estagiário via e-mail — ele vai definir a própria senha no primeiro acesso
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email.toLowerCase(),
      { redirectTo: `${APP_URL}/set-password` }
    )

    if (authError || !authData.user) {
      const msg = authError?.message?.includes('already registered') || authError?.message?.includes('already been registered')
        ? 'Este e-mail já está cadastrado.'
        : `Erro ao criar usuário: ${authError?.message}`
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = authData.user.id
    const photoUrl: string | null = (body.photo_url as string | null) ?? null
    const nickname: string | null = (body.nickname as string | null) ?? null

    // Criar perfil completo
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: formatFullName(data.full_name),
        email: data.email.toLowerCase(),
        nickname: nickname,
        course: data.course || null,
        internship_start: data.internship_start || null,
        internship_end: data.internship_end || null,
        is_active: data.is_active ?? true,
        role: 'intern',
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    console.error('[create-intern]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
