import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const { searchParams } = request.nextUrl
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  try {
    const report = await ctx.container.getMonthlyReportUseCase().execute(
      { month, year },
      ctx.user.id,
    )

    return NextResponse.json({ report, month, year })
  } catch (error) {
    return handleError(error)
  }
}
