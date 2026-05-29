import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { full_name, nickname, email, course, password, photo_base64 } = await request.json()

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseServiceClient()

    // Verificar se email já existe no profiles
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 409 })
    }

    // Verificar se email existe em auth.users (usuário órfão sem profile)
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers()
    const orphanUser = authList?.users?.find(u => u.email === email.toLowerCase())
    if (orphanUser) {
      await supabaseAdmin.auth.admin.deleteUser(orphanUser.id)
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: `Erro ao criar conta: ${authError.message}` }, { status: 500 })
    }

    const userId = authData.user.id

    // Upload da foto server-side (service role ignora RLS do bucket)
    let photo_url: string | null = null
    if (photo_base64) {
      try {
        const photoBuffer = Buffer.from(photo_base64, 'base64')
        const fileName = `${userId}/selfie_${Date.now()}.jpg`

        const { error: storageErr } = await supabaseAdmin.storage
          .from('avatars')
          .upload(fileName, photoBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (!storageErr) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName)
          photo_url = publicUrl
        } else {
          console.error('[register-with-photo] storage error:', storageErr.message)
          // Não bloqueia o cadastro se a foto falhar — profile fica sem foto
        }
      } catch (photoErr) {
        console.error('[register-with-photo] photo processing error:', photoErr)
      }
    }

    // Criar profile com photo_url já preenchida
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      nickname: nickname || null,
      email: email.toLowerCase(),
      course: course || null,
      photo_url,
      role: 'intern',
      is_active: true,
      internship_start: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'id' })

    if (profileError) {
      // Rollback: deletar auth user se profile falhar
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erro ao criar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId, message: 'Cadastro realizado!' })
  } catch (err) {
    console.error('[register-with-photo]', err)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
