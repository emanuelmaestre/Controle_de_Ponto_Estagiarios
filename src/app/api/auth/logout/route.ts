import { NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError } from '@/lib/api-helpers'

export async function POST() {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  try {
    await ctx.container.logoutUseCase().execute()
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), 303)
  } catch (error) {
    return handleError(error)
  }
}
