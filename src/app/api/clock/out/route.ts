import { NextRequest } from 'next/server'
import { getAuthenticatedContainer, handleError, ok } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const { recordId, activities, notes } = await request.json()

  if (!recordId || !activities || activities.length === 0) {
    return handleError(new Error('recordId e pelo menos uma atividade sao obrigatorios'))
  }

  try {
    await ctx.container.clockOutUseCase().execute({
      recordId,
      userId: ctx.user.id,
      activities,
      notes,
    })
    return ok()
  } catch (error) {
    return handleError(error)
  }
}
