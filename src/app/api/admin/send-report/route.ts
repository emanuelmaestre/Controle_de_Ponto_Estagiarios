import { NextResponse } from 'next/server'
import { requireManager } from '@/lib/route-auth'

export async function POST(req: Request) {
  try {
    const auth = await requireManager()
    if (!auth.ok) return auth.response

    const { month, email, data } = await req.json() as {
      month: string
      email: string
      data: Array<{
        nome: string
        curso?: string
        total_horas: string
        aprovados: number
        pendentes: number
      }>
    }

    // Gerar HTML do relatório
    const rows = data.map(r => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${r.nome}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b">${r.curso || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e3a8a">${r.total_horas}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#16a34a">${r.aprovados}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#d97706">${r.pendentes}</td>
      </tr>
    `).join('')

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">Controle de Ponto</h1>
          <p style="color:#93c5fd;margin:8px 0 0">Relatório Mensal — ${month}</p>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8fafc">
                <th style="text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase">Nome</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase">Curso</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase">Total</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase">Aprov.</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;color:#64748b;text-transform:uppercase">Pend.</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">
            Relatório gerado automaticamente pelo sistema de Controle de Ponto.
          </p>
        </div>
      </div>
    `

    const resendKey = process.env.RESEND_API_KEY

    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Controle de Ponto <noreply@${process.env.RESEND_DOMAIN ?? 'laboratorio.app'}>`,
          to: [email],
          subject: `Relatório de Ponto — ${month}`,
          html,
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { message?: string }
        return NextResponse.json({ error: err.message ?? 'Erro no Resend.' }, { status: 500 })
      }
    } else {
      // Sem RESEND_API_KEY configurado — log apenas
      console.log('[send-report] RESEND_API_KEY não configurado. E-mail não enviado para:', email)
    }

    return NextResponse.json({ ok: true, message: 'E-mail enviado com sucesso!' })
  } catch (e) {
    console.error('[send-report]', e)
    return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 })
  }
}
