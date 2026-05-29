import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const { searchParams } = request.nextUrl
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  try {
    const results = await ctx.container.listRecordsUseCase().execute(ctx.user.id, month, year)

    const data = results.map(({ record, activities }) => ({
      id: record.id,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      durationMinutes: record.durationMinutes,
      notes: record.notes,
      isOpen: record.isOpen,
      activities: activities.map(a => a.description),
    }))

    return NextResponse.json({ records: data })
  } catch (error) {
    return handleError(error)
  }
}
