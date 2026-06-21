import { NextResponse } from 'next/server'

export function deprecatedRoute(feature: string) {
  return NextResponse.json(
    {
      error: 'Funcionalidade descontinuada.',
      feature,
    },
    { status: 410 },
  )
}
