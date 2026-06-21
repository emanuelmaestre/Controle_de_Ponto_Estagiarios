import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { createLogger } from '@/lib/logger'

const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const logger = createLogger('api.auth.register-with-photo')

const registerWithPhotoSchema = z.object({
  full_name: z.string().trim().min(3).max(100),
  nickname: z.string().trim().max(50).optional().nullable(),
  email: z.string().trim().email().transform(email => email.toLowerCase()),
  course: z.string().trim().max(100).optional().nullable(),
  password: z.string().min(6),
  photo_base64: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = registerWithPhotoSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados invalidos.' }, { status: 400 })
    }

    const { full_name, nickname, email, course, password, photo_base64 } = parsed.data
    const supabaseAdmin = createSupabaseServiceClient()

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail ja esta cadastrado no sistema.' }, { status: 409 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        nickname: nickname || null,
        course: course || null,
      },
    })

    if (authError || !authData.user) {
      const message = authError?.message.toLowerCase() ?? ''
      const status = message.includes('already') || message.includes('exists') ? 409 : 500
      return NextResponse.json({ error: 'Nao foi possivel criar a conta.' }, { status })
    }

    const userId = authData.user.id

    let photo_url: string | null = null
    if (photo_base64) {
      try {
        const photoBuffer = Buffer.from(photo_base64, 'base64')
        if (photoBuffer.byteLength > MAX_PHOTO_BYTES) {
          await supabaseAdmin.auth.admin.deleteUser(userId)
          return NextResponse.json({ error: 'Foto muito grande.' }, { status: 413 })
        }

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
          logger.error('storage upload failed', storageErr)
        }
      } catch (photoErr) {
        logger.error('photo processing failed', photoErr)
      }
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      nickname: nickname || null,
      email,
      course: course || null,
      photo_url,
      role: 'intern',
      is_active: true,
      internship_start: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'id' })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: 'Erro ao criar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId, message: 'Cadastro realizado!' })
  } catch (err) {
    logger.error('request failed', err)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
