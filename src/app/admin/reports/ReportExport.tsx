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
}

export default function ReportExport({ data, month }: Props) {
  const [loading, setLoading] = useState(false)

  const exportCSV = () => {
    setLoading(true)
    const headers = ['Nome', 'E-mail', 'Curso', 'Total Horas', 'Sessões', 'Aprovadas', 'Pendentes', 'Reprovadas']
    const rows = data.map(r => [
      r.nome, r.email, r.curso, r.total_horas,
      r.sessoes, r.aprovados, r.pendentes, r.reprovados,
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ month, data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${month}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        disabled={loading || data.length === 0}
        className="flex items-center gap-1.5 bg-white text-blue-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-40"
      >
        ↓ CSV
      </button>
      <button
        onClick={exportJSON}
        disabled={data.length === 0}
        className="flex items-center gap-1.5 bg-blue-800 text-white font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
      >
        ↓ JSON
      </button>
    </div>
  )
}
