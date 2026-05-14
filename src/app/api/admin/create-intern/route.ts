import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { internSchema } from '@/lib/validations'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = internSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    const data = parsed.data

    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Gerar senha temporária aleatória — o estagiário vai redefinir via e-mail
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: tempPassword,
      email_confirm: true, // já confirma o e-mail
    })

    if (authError || !authData.user) {
      const msg = authError?.message?.includes('already registered')
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar usuário.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const userId = authData.user.id

    // Criar/atualizar perfil (o trigger já cria um perfil básico, mas atualizamos com os dados completos)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: data.full_name,
        email: data.email.toLowerCase(),
        course: data.course || null,
        internship_start: data.internship_start || null,
        internship_end: data.internship_end || null,
        is_active: data.is_active ?? true,
        role: 'intern',
      })

    if (profileError) {
      // Rollback: deletar usuário criado
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
    }

    // Enviar e-mail de redefinição de senha para o estagiário definir sua própria
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: data.email.toLowerCase(),
    })
    // (o link de recovery é enviado automaticamente pelo Supabase Auth com o template configurado)

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    console.error('[create-intern]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
