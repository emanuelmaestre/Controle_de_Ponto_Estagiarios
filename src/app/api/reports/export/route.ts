import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedContainer, handleError } from '@/lib/api-helpers'
import { minutesToHours } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const ctx = await getAuthenticatedContainer()
  if ('error' in ctx) return ctx.error

  const { searchParams } = request.nextUrl
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const format = searchParams.get('format') || 'csv'

  try {
    const report = await ctx.container.getMonthlyReportUseCase().execute(
      { month, year },
      ctx.user.id,
    )

    if (format === 'csv') {
      const rows = ['Estagiario,Horas,Sessoes']
      report.forEach(r => {
        rows.push(`"${r.internName}",${minutesToHours(r.totalMinutes)},${r.totalSessions}`)
      })

      return new NextResponse(rows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-${year}-${String(month).padStart(2, '0')}.csv"`,
        },
      })
    }

    const monthLabel = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const totalMinutes = report.reduce((s, r) => s + r.totalMinutes, 0)
    const totalSessions = report.reduce((s, r) => s + r.totalSessions, 0)

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatorio ${monthLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; color: #666; font-weight: normal; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; background: #f5f5f5; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    tfoot td { font-weight: bold; border-top: 2px solid #333; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>ChronosLab — Relatorio de Horas</h1>
  <h2>${monthLabel}</h2>
  <table>
    <thead>
      <tr><th>Estagiario</th><th class="right">Horas</th><th class="right">Sessoes</th></tr>
    </thead>
    <tbody>
      ${report.map(r => `<tr><td>${r.internName}</td><td class="right">${minutesToHours(r.totalMinutes)}</td><td class="right">${r.totalSessions}</td></tr>`).join('\n')}
    </tbody>
    <tfoot>
      <tr><td>Total</td><td class="right">${minutesToHours(totalMinutes)}</td><td class="right">${totalSessions}</td></tr>
    </tfoot>
  </table>
  <script>window.onload = () => window.print()</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    return handleError(error)
  }
}
