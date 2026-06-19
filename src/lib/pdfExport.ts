const BRAND_GREEN  = '#3fe56c'
const BRAND_DARK   = '#003912'
const BRAND_BG     = '#0b1d12'
const TEXT_PRIMARY = '#e8f5e9'
const TEXT_MUTED   = '#6b8f71'

export interface PdfColumn {
  header: string
  dataKey: string
  width?: number
}

export interface PdfExportOptions {
  title: string
  subtitle?: string
  period?: string
  columns: PdfColumn[]
  rows: Record<string, string | number>[]
  orientation?: 'portrait' | 'landscape'
}

export async function exportPDF(opts: PdfExportOptions): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new (jsPDF as any)({
    orientation: opts.orientation ?? 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ── Fundo escuro ──
  doc.setFillColor(11, 29, 18)
  doc.rect(0, 0, pageW, pageH, 'F')

  // ── Barra de cabeçalho verde ──
  doc.setFillColor(0, 57, 18)
  doc.rect(0, 0, pageW, 38, 'F')

  // Linha verde brilhante no topo
  doc.setFillColor(63, 229, 108)
  doc.rect(0, 0, pageW, 1.5, 'F')

  // Círculo decorativo (logo placeholder)
  doc.setFillColor(63, 229, 108)
  doc.circle(14, 13, 5, 'F')
  doc.setFillColor(0, 57, 18)
  doc.circle(14, 13, 3.5, 'F')
  doc.setFillColor(63, 229, 108)
  doc.circle(14, 13, 1.5, 'F')

  // Nome do sistema
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(63, 229, 108)
  doc.text('CHRONOS LAB', 22, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 143, 113)
  doc.text('Sistema de Controle de Ponto', 22, 16)

  // Título do relatório (direita)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(232, 245, 233)
  doc.text(opts.title, pageW - 10, 11, { align: 'right' })

  if (opts.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 143, 113)
    doc.text(opts.subtitle, pageW - 10, 17, { align: 'right' })
  }

  // Período
  const infoY = 26
  if (opts.period) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(63, 229, 108)
    doc.text(`Período: ${opts.period}`, 10, infoY)
  }

  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  doc.setFontSize(7.5)
  doc.setTextColor(107, 143, 113)
  doc.text(`Emitido em: ${now}`, pageW - 10, infoY, { align: 'right' })

  // Linha separadora
  doc.setDrawColor(0, 100, 40)
  doc.setLineWidth(0.4)
  doc.line(10, 32, pageW - 10, 32)

  // ── Tabela ──
  const colStyles: Record<string, { cellWidth: number }> = {}
  opts.columns.forEach((col, i) => {
    if (col.width) colStyles[i] = { cellWidth: col.width }
  })

  autoTable(doc, {
    startY: 42,
    head: [opts.columns.map(c => c.header)],
    body: opts.rows.map(row => opts.columns.map(c => String(row[c.dataKey] ?? ''))),
    columnStyles: colStyles,
    headStyles: {
      fillColor: [0, 57, 18],
      textColor: [63, 229, 108],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0,
      cellPadding: 4,
    },
    bodyStyles: {
      fillColor: [11, 29, 18],
      textColor: [200, 225, 200],
      fontSize: 8,
      lineColor: [0, 57, 18],
      lineWidth: 0.3,
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [15, 35, 24],
    },
    tableLineColor: [0, 80, 30],
    tableLineWidth: 0.4,
    margin: { left: 10, right: 10 },
    didDrawPage: (data: { pageNumber: number }) => {
      // Rodapé
      const pageNum = data.pageNumber
      const totalPages = (doc.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages()

      doc.setFillColor(0, 57, 18)
      doc.rect(0, pageH - 12, pageW, 12, 'F')
      doc.setFillColor(63, 229, 108)
      doc.rect(0, pageH - 12, pageW, 0.5, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(107, 143, 113)
      doc.text('Documento gerado automaticamente pelo Chronos Lab', 10, pageH - 5)
      doc.text(`Página ${pageNum} de ${totalPages}`, pageW - 10, pageH - 5, { align: 'right' })
    },
  })

  const safeTitle = opts.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  doc.save(`${safeTitle}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
