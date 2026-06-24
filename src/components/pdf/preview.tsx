import React from 'react'
import { renderToFile } from '@react-pdf/renderer'
import { FrequenciaIndividual } from './FrequenciaIndividual'

const mockRecords = [
  { date: '02/06', clockIn: '08:00', clockOut: '12:00', duration: '4h00',  status: 'approved' as const, activities: ['Análise de amostras de solo'] },
  { date: '03/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Inoculação de fungos em substrato'] },
  { date: '04/06', clockIn: '08:30', clockOut: '17:00', duration: '7h30',  status: 'approved' as const, activities: ['Leitura de placas de Petri'] },
  { date: '05/06', clockIn: '—',     clockOut: null,    duration: '—',     status: 'rejected' as const, activities: ['Ausência justificada'] },
  { date: '06/06', clockIn: '08:00', clockOut: '12:00', duration: '4h00',  status: 'approved' as const, activities: ['Documentação de resultados'] },
  { date: '09/06', clockIn: '07:45', clockOut: '17:15', duration: '8h30',  status: 'approved' as const, activities: ['Coleta de material em campo — entrada antecipada registrada'] },
  { date: '10/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Preparo de reagentes e soluções para experimento'] },
  { date: '11/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Microscopia de amostras coletadas'] },
  { date: '12/06', clockIn: '08:00', clockOut: '12:00', duration: '4h00',  status: 'approved' as const, activities: ['Reunião com orientador'] },
  { date: '13/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Análise estatística dos dados coletados no período anterior'] },
  { date: '16/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Redação do relatório parcial de atividades'] },
  { date: '17/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Revisão bibliográfica'] },
  { date: '18/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'pending'  as const, activities: ['Experimento de campo — coleta de solo e material vegetal'] },
  { date: '19/06', clockIn: '—',     clockOut: null,    duration: '—',     status: 'pending'  as const, activities: ['Sem registro de ponto'] },
  { date: '20/06', clockIn: '08:00', clockOut: '17:00', duration: '8h00',  status: 'approved' as const, activities: ['Finalização de experimento e limpeza do laboratório'] },
]

;(async () => {
  const el = React.createElement(FrequenciaIndividual, {
    studentName:      'Ana Carolina Ferreira',
    course:           'Agronomia — 8º Semestre',
    period:           { start: '01/06/2026', end: '20/06/2026' },
    records:          mockRecords,
    totalHours:       '138.5h',
    requiredHours:    '160h',
    totalSessions:    15,
    approvedSessions: 12,
    supervisorName:   'Prof. Dr. Milton Andrade',
    institutionName:  'Chronos Lab',
  })

  await renderToFile(el as any, './frequencia_preview.pdf')
  console.log('✅  frequencia_preview.pdf gerado!')
})()
