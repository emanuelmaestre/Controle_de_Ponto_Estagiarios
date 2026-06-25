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

    // Service client apenas para storage (RLS não cobre buckets)
    const storageClient = createSupabaseServiceClient()

    const update: {
      full_name?: string
      nickname?: string | null
      course?: string | null
      photo_url?: string
    } = {}
    if (full_name !== undefined) update.full_name = full_name.trim()
    if (nickname !== undefined) update.nickname = nickname?.trim() || null
    if (course !== undefined) update.course = course || null

    if (photo_base64) {
      const buffer = Buffer.from(photo_base64, 'base64')
      const fileName = `${user.id}/selfie_${Date.now()}.jpg`
      const { error: storageErr } = await storageClient.storage
        .from('avatars')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
      if (storageErr) {
        return NextResponse.json({ error: 'Erro ao salvar foto. Tente novamente.' }, { status: 500 })
      }
      const { data: { publicUrl } } = storageClient.storage.from('avatars').getPublicUrl(fileName)
      update.photo_url = publicUrl
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true, message: 'Nada para atualizar.' })
    }

    // Usa cliente autenticado do usuário — respeita RLS
    const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[profile/update]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
