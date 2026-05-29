import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError, ok } from '@/lib/api-helpers'

export async function GET() {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  try {
    const settings = await ctx.container.repos.settings.get()
    return NextResponse.json({
      settings: {
        labName: settings.labName,
        expectedDailyHours: settings.expectedDailyHours,
        reportEmail: settings.reportEmail,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function PUT(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const profile = await ctx.container.repos.user.findById(ctx.user.id)
  if (!profile || !profile.isManager) {
    return NextResponse.json({ error: 'Apenas gestores podem alterar configuracoes' }, { status: 403 })
  }

  const body = await request.json()
  const settings = await ctx.container.repos.settings.get()

  if (body.labName !== undefined) settings.labName = body.labName
  if (body.expectedDailyHours !== undefined) settings.expectedDailyHours = body.expectedDailyHours
  if (body.reportEmail !== undefined) settings.reportEmail = body.reportEmail || null

  try {
    await ctx.container.repos.settings.update(settings)
    return ok()
  } catch (error) {
    return handleError(error)
  }
}
