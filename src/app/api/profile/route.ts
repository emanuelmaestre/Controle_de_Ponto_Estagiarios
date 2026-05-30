import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError, ok } from '@/lib/api-helpers'
import { createSupabaseServiceClient } from '@/infra/supabase/server'

export async function GET() {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  try {
    const profile = await ctx.container.repos.user.findById(ctx.user.id)
    if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

    return NextResponse.json({
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        course: profile.course,
        photoUrl: profile.photoUrl,
        role: profile.role,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const body = await request.json()

  try {
    const serviceClient = createSupabaseServiceClient()
    let photoUrl: string | undefined

    if (body.photoBase64) {
      const buffer = Buffer.from(body.photoBase64, 'base64')
      const fileName = `${ctx.user.id}/photo_${Date.now()}.jpg`
      const { error: storageErr } = await serviceClient.storage
        .from('avatars')
        .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

      if (storageErr) return handleError(new Error('Erro ao salvar foto'))

      const { data: { publicUrl } } = serviceClient.storage.from('avatars').getPublicUrl(fileName)
      photoUrl = publicUrl
    }

    const profile = await ctx.container.repos.user.findById(ctx.user.id)
    if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })

    if (body.fullName) profile.fullName = body.fullName
    if (body.course !== undefined) profile.course = body.course || null
    if (photoUrl) profile.photoUrl = photoUrl

    await ctx.container.repos.user.update(profile)
    return ok()
  } catch (error) {
    return handleError(error)
  }
}
