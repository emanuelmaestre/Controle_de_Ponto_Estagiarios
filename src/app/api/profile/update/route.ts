import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { full_name, nickname, course, photo_base64 } = await request.json() as {
      full_name?: string
      nickname?: string | null
      course?: string | null
      photo_base64?: string | null
    }

    if (full_name !== undefined && (!full_name || full_name.trim().split(' ').filter(Boolean).length < 2)) {
      return NextResponse.json({ error: 'Informe o nome completo (nome e sobrenome).' }, { status: 400 })
    }

    const admin = createSupabaseServiceClient()

    const update: {
      full_name?: string
      nickname?: string | null
      course?: string | null
      photo_url?: string
    } = {}
    if (full_name !== undefined) update.full_name = full_name.trim()
    if (nickname !== undefined) update.nickname = nickname?.trim() || null
    if (course !== undefined) update.course = course || null

    // Upload da nova foto (server-side, service role ignora RLS)
    if (photo_base64) {
      const buffer = Buffer.from(photo_base64, 'base64')
      const fileName = `${user.id}/selfie_${Date.now()}.jpg`
      const { error: storageErr } = await admin.storage
        .from('avatars')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
      if (storageErr) {
        return NextResponse.json({ error: 'Erro ao salvar foto. Tente novamente.' }, { status: 500 })
      }
      const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(fileName)
      update.photo_url = publicUrl
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, message: 'Nada para atualizar.' })
    }

    const { error } = await admin.from('profiles').update(update).eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[profile/update]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
