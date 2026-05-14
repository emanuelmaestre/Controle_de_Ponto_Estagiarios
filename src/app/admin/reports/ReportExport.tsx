'use client'
import { useState } from 'react'

interface ReportRow {
  nome: string
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
  month: string
  monthLabel: string
}

export default function ReportExport({ data, month, monthLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const [emailModal, setEmailModal] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')

  const exportExcel = async () => {
    setLoading(true)
    const XLSX = await import('xlsx')
    const wsData = [
      ['Relatório de Horas — ' + monthLabel],
      [],
      ['Nome', 'E-mail', 'Curso', 'Total Horas', 'Sessões', 'Aprovadas', 'Pendentes', 'Reprovadas'],
      ...data.map(r => [r.nome, r.email, r.curso, r.total_horas, r.sessoes, r.aprovados, r.pendentes, r.reprovados]),
      [],
      ['Total geral', '', '', '', data.reduce((a, r) => a + r.sessoes, 0)],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [
      { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
    XLSX.writeFile(wb, `relatorio-${month}.xlsx`)
    setLoading(false)
  }

  const exportPDF = () => {
    window.print()
  }

  const sendEmail = async () => {
    setEmailStatus('sending')
    const res = await fetch('/api/admin/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: monthLabel, email: emailTo, data }),
    })
    setEmailStatus(res.ok ? 'ok' : 'err')
    if (res.ok) {
      setTimeout(() => {
        setEmailModal(false)
        setEmailStatus('idle')
        setEmailTo('')
      }, 2000)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 print:hidden">
        <button
          onClick={exportExcel}
          disabled={loading || data.length === 0}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm"
        >
          📊 Excel
        </button>
        <button
          onClick={exportPDF}
          disabled={data.length === 0}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm"
        >
          📄 PDF
        </button>
        <button
          onClick={() => setEmailModal(true)}
          disabled={data.length === 0}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-40 shadow-sm"
        >
          ✉️ E-mail
        </button>
      </div>

      {/* Modal de envio por e-mail */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-800 mb-1">Enviar relatório por e-mail</h2>
            <p className="text-xs text-gray-500 mb-4">O relatório de {monthLabel} será enviado ao destinatário.</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatário</label>
            <input
              type="email"
              value={emailTo}
              onChange={e => setEmailTo(e.target.value)}
              placeholder="gerente@empresa.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            />

            {emailStatus === 'ok' && (
              <p className="text-green-600 text-sm mb-3">E-mail enviado com sucesso!</p>
            )}
            {emailStatus === 'err' && (
              <p className="text-red-500 text-sm mb-3">Erro ao enviar. Verifique as configurações.</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setEmailModal(false); setEmailStatus('idle'); setEmailTo('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={sendEmail}
                disabled={!emailTo || emailStatus === 'sending' || emailStatus === 'ok'}
                className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {emailStatus === 'sending' ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
