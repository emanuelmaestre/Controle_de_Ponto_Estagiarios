import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { GenericTableReport } from '@/components/pdf/GenericTableReport'

// Importa o handler do catálogo diretamente (sem HTTP interno)
import { GET as catalogHandler } from '@/app/api/admin/reports-catalog/route'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autenticado', { status: 401 })

  const { data: authProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (authProfile?.role !== 'manager')
    return new NextResponse('Sem permissão', { status: 403 })

  const { searchParams } = new URL(req.url)
  const report   = searchParams.get('report')   ?? ''
  const month    = searchParams.get('month')    ?? ''
  const internId = searchParams.get('internId') ?? ''

  // Chama o handler do catálogo diretamente (sem fetch HTTP interno)
  const catalogReq = new NextRequest(
    `${new URL(req.url).origin}/api/admin/reports-catalog?report=${report}&month=${month}&internId=${internId}`,
    { headers: req.headers }
  )
  const catalogRes = await catalogHandler(catalogReq)
  if (!catalogRes.ok)
    return new NextResponse('Erro ao buscar dados do relatório', { status: catalogRes.status })

  const data = await catalogRes.json()

  const db = createSupabaseServiceClient()
  const { data: settings } = await db.from('settings').select('lab_name').single()
  const institutionName = settings?.lab_name ?? 'Controle de Ponto'

  const pdf = React.createElement(GenericTableReport as any, {
    title:           data.title ?? data.tableTitle ?? 'Relatório',
    tableTitle:      data.tableTitle,
    period:          data.period ?? month,
    institutionName,
    supervisorName:  data.supervisor,
    internName:      data.internName,
    summaryCards:    data.summaryCards?.map((c: any) => ({
      label: c.label, value: String(c.value), colorKey: c.colorKey,
    })),
    progressBar:     data.progressBar,
    columns:         data.columns ?? [],
    rows:            data.rows ?? [],
    totals:          data.totals,
  })

  const buffer = Buffer.from(await renderToBuffer(pdf as any))
  const slug   = (data.tableTitle ?? report).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${slug}-${month}.pdf"`,
    },
  })
}
