import { getAuthenticatedContainer, handleError, ok } from '@/lib/api-helpers'

export async function POST() {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  try {
    const record = await ctx.container.clockInUseCase().execute(ctx.user.id)
    return ok({ record: { id: record.id, clockIn: record.clockIn } })
  } catch (error) {
    return handleError(error)
  }
}
