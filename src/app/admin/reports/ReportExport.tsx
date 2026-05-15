'use client'
import { useState } from 'react'

interface ReportRow {
  nome: string
  apelido: string
  email: string
  curso: string
  total_horas: string
  sessoes: number
  aprovados: number
  pendentes: number
  reprovados: number
}

interface Props {
  data: ReportRow[]
  label: string
  disabled?: boolean
}

export default function ReportExport({ data, label, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')

  const exportExcel = async () => {
    if (disabled || data.length === 0) return
    setLoading(true)
    const XLSX = await import('xlsx')
    const wsData = [
      [`Relatório de Horas — ${label}`],
      [],
      ['Nome', 'Apelido', 'E-mail', 'Curso', 'Total Horas', 'Sessões', 'Aprovadas', 'Pendentes', 'Reprovadas'],
      ...data.map(r => [r.nome, r.apelido, r.email, r.curso, r.total_horas, r.sessoes, r.aprovados, r.pendentes, r.reprovados]),
      [],
      ['Total geral', '', '', '', '', data.reduce((a, r) => a + r.sessoes, 0)],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
    XLSX.writeFile(wb, `relatorio-${label.replace(/\//g, '-')}.xlsx`)
    setLoading(false)
  }

  const exportPDF = () => window.print()

  const sendEmail = async () => {
    setEmailStatus('sending')
    const res = await fetch('/api/admin/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: label, email: emailTo, data }),
    })
    setEmailStatus(res.ok ? 'ok' : 'err')
    if (res.ok) {
      setTimeout(() => { setEmailModal(false); setEmailStatus('idle'); setEmailTo('') }, 2000)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 no-print">
        <button
          onClick={exportExcel}
          disabled={!!disabled || loading}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm"
        >
          📊 Excel
        </button>
        <button
          onClick={exportPDF}
          disabled={!!disabled}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm"
        >
          📄 PDF
        </button>
        <button
          onClick={() => setEmailModal(true)}
          disabled={!!disabled}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm"
        >
          ✉️ E-mail
        </button>
      </div>

      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-800 mb-1">Enviar relatório por e-mail</h2>
            <p className="text-xs text-gray-500 mb-4">Período: {label}</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatário</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder="gerente@empresa.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            />
            {emailStatus === 'ok'  && <p className="text-green-600 text-sm mb-3">✅ E-mail enviado!</p>}
            {emailStatus === 'err' && <p className="text-red-500 text-sm mb-3">❌ Erro ao enviar.</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setEmailModal(false); setEmailStatus('idle'); setEmailTo('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >Cancelar</button>
              <button
                onClick={sendEmail}
                disabled={!emailTo || emailStatus === 'sending' || emailStatus === 'ok'}
                className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >{emailStatus === 'sending' ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
