import { NextRequest } from 'next/server'
import { getAuthenticatedContainer, handleError, ok } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const { internId } = await request.json()

  if (!internId) {
    return handleError(new Error('internId e obrigatorio'))
  }

  try {
    const isActive = await ctx.container.toggleInternActiveUseCase().execute(internId, ctx.user.id)
    return ok({ isActive })
  } catch (error) {
    return handleError(error)
  }
}
