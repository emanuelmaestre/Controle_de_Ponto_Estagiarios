import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError, ok } from '@/lib/api-helpers'

export async function GET() {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  try {
    const interns = await ctx.container.listInternsUseCase().execute(ctx.user.id)

    const data = interns.map(i => ({
      id: i.id,
      fullName: i.fullName,
      email: i.email,
      course: i.course,
      isActive: i.isActive,
      createdAt: i.createdAt,
    }))

    return NextResponse.json({ interns: data })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const { fullName, email, course } = await request.json()

  if (!fullName || !email) {
    return handleError(new Error('Nome e email sao obrigatorios'))
  }

  try {
    const intern = await ctx.container.createInternUseCase().execute(
      { fullName, email, course },
      ctx.user.id,
    )
    return ok({ userId: intern.id })
  } catch (error) {
    return handleError(error)
  }
}
