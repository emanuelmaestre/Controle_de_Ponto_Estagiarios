'use client'
import { useState } from 'react'
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
        {[
          { onClick: exportExcel, disabled: !!disabled || loading, bg: '#059669', hoverBg: '#10b981', label: loading ? 'Gerando...' : 'Excel', icon: loading ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} /> },
          { onClick: exportPDF, disabled: !!disabled, bg: '#dc2626', hoverBg: '#ef4444', label: 'PDF', icon: <span>📄</span> },
          { onClick: () => setEmailModal(true), disabled: !!disabled, bg: '#2563eb', hoverBg: '#3b82f6', label: 'E-mail', icon: <Mail size={13} /> },
        ].map(({ onClick, disabled: dis, bg, label, icon }) => (
          <motion.button
            key={label}
            onClick={onClick}
            disabled={dis}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-white font-semibold text-sm px-4 py-2 rounded-xl disabled:opacity-40 shadow-sm"
            style={{ background: bg }}
          >
            {icon} {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {emailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
              style={{ background: 'var(--surface, white)' }}
            >
              <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text, #111)' }}>Enviar relatório por e-mail</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--text-3, #6b7280)' }}>Período: {label}</p>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-2, #374151)' }}>Destinatário</label>
              <input
                type="email"
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="gerente@empresa.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all mb-4"
                style={{ background: 'var(--input-bg, #f9fafb)', border: '1.5px solid var(--border, #e5e7eb)', color: 'var(--text, #111)' }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = 'var(--border, #e5e7eb)')}
              />
              <AnimatePresence>
                {emailStatus === 'ok' && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-sm mb-3" style={{ color: 'var(--success, #16a34a)' }}>
                    <CheckCircle2 size={14} /> E-mail enviado!
                  </motion.p>
                )}
                {emailStatus === 'err' && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-sm mb-3" style={{ color: 'var(--danger, #dc2626)' }}>
                    <AlertTriangle size={14} /> Erro ao enviar.
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => { setEmailModal(false); setEmailStatus('idle'); setEmailTo('') }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid var(--border, #e5e7eb)', color: 'var(--text-2, #374151)', background: 'var(--bg, #f9fafb)' }}
                >Cancelar</motion.button>
                <motion.button
                  onClick={sendEmail}
                  disabled={!emailTo || emailStatus === 'sending' || emailStatus === 'ok'}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ background: '#1e3a5f' }}
                >
                  {emailStatus === 'sending' ? <><Loader2 size={13} className="animate-spin" /> Enviando...</> : 'Enviar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
