'use client'
import { useState } from 'react'
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Mail, Printer, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ReportRow {
  nome: string
  apelido: string
  email: string
  curso: string
  total_horas: string
  sessoes: number
  aprovados: number
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
      ['Nome', 'Apelido', 'E-mail', 'Curso', 'Total Horas', 'Sessões', 'Aprovadas', 'Reprovadas'],
      ...data.map(r => [r.nome, r.apelido, r.email, r.curso, r.total_horas, r.sessoes, r.aprovados, r.reprovados]),
      [],
      ['Total geral', '', '', '', '', data.reduce((a, r) => a + r.sessoes, 0)],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
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

  const buttons = [
    {
      key: 'excel',
      onClick: exportExcel,
      disabled: !!disabled || loading || data.length === 0,
      icon: loading ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />,
      label: loading ? 'Gerando…' : 'Excel',
      color: '#059669',
      glow: 'rgba(5,150,105,0.35)',
    },
    {
      key: 'pdf',
      onClick: exportPDF,
      disabled: !!disabled,
      icon: <Printer size={14} />,
      label: 'PDF',
      color: '#dc2626',
      glow: 'rgba(220,38,38,0.3)',
    },
    {
      key: 'email',
      onClick: () => setEmailModal(true),
      disabled: !!disabled || data.length === 0,
      icon: <Mail size={14} />,
      label: 'E-mail',
      color: '#2563eb',
      glow: 'rgba(37,99,235,0.3)',
    },
  ]

  return (
    <>
      {/* ── Export buttons ── */}
      <div className="no-print flex items-center gap-2 flex-wrap">
        {buttons.map((btn, i) => (
          <motion.button
            key={btn.key}
            onClick={btn.onClick}
            disabled={btn.disabled}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={!btn.disabled ? { scale: 1.04, y: -2 } : {}}
            whileTap={!btn.disabled ? { scale: 0.95 } : {}}
            className="flex items-center gap-2 font-black text-[11px] px-3.5 py-2 rounded-xl text-white tracking-wider disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            style={{
              background: btn.disabled ? '#64748b' : btn.color,
              boxShadow: btn.disabled ? 'none' : `0 4px 14px ${btn.glow}`,
              letterSpacing: '0.06em',
            }}
          >
            {btn.icon}
            {btn.label}
          </motion.button>
        ))}
      </div>

      {/* ── Email modal ── */}
      <AnimatePresence>
        {emailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="rounded-3xl w-full max-w-sm overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
            >
              {/* Header */}
              <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.12)' }}>
                    <Mail size={15} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                    <p className="font-black text-sm" style={{ color: 'var(--text)' }}>Enviar Relatório</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>Período: {label}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => { setEmailModal(false); setEmailStatus('idle'); setEmailTo('') }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg)', color: 'var(--text-3)' }}
                >
                  <X size={13} />
                </motion.button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Destinatário</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="gerente@empresa.com"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all font-medium"
                    style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)' }}
                    onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                <AnimatePresence>
                  {emailStatus === 'ok' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
                    >
                      <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>E-mail enviado com sucesso!</p>
                    </motion.div>
                  )}
                  {emailStatus === 'err' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>Erro ao enviar. Tente novamente.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2.5">
                  <motion.button
                    onClick={() => { setEmailModal(false); setEmailStatus('idle'); setEmailTo('') }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ border: '1.5px solid var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    onClick={sendEmail}
                    disabled={!emailTo || emailStatus === 'sending' || emailStatus === 'ok'}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: '#2563eb', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
                  >
                    {emailStatus === 'sending'
                      ? <><Loader2 size={13} className="animate-spin" /> Enviando…</>
                      : 'Enviar'
                    }
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
