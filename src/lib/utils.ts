import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RecordStatus } from '@/types/database'

// ──────────────────────────────────────────────────────────
// Tailwind class merger (padrão shadcn/ui)
// ──────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ──────────────────────────────────────────────────────────
// Formatação de nome completo — padrão pt-BR
// Capitaliza a primeira letra de cada palavra, exceto
// preposições: de, da, do, das, dos, e, em, no, na, nos, nas
// ──────────────────────────────────────────────────────────
const LOWERCASE_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'no', 'na', 'nos', 'nas',
  'a', 'o', 'as', 'os',
])

export function formatFullName(name: string): string {
  if (!name) return name
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index !== 0 && LOWERCASE_WORDS.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// ──────────────────────────────────────────────────────────
// Formatação de datas no fuso de São Paulo
// ──────────────────────────────────────────────────────────
const TZ = 'America/Sao_Paulo'

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatMonthYear(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

// ──────────────────────────────────────────────────────────
// Formatação de horas e minutos
// ──────────────────────────────────────────────────────────
export function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m > 0 ? ` ${String(m).padStart(2, '0')}min` : ''}`
}

export function minutesToDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1) + 'h'
}

// ──────────────────────────────────────────────────────────
// Status do registro — labels e cores
// ──────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<
  RecordStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pendente',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  approved: {
    label: 'Aprovado',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  rejected: {
    label: 'Reprovado',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
}

// ──────────────────────────────────────────────────────────
// Validação de arquivo de foto
// ──────────────────────────────────────────────────────────
export function validatePhotoFile(file: File): string | null {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png']
  const MAX_SIZE = 2 * 1024 * 1024 // 2MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Apenas arquivos JPEG ou PNG são permitidos.'
  }
  if (file.size > MAX_SIZE) {
    return 'A foto deve ter no máximo 2MB.'
  }
  return null
}

// ──────────────────────────────────────────────────────────
// Gerar nome de arquivo seguro para o Storage
// ──────────────────────────────────────────────────────────
export function generateAvatarPath(userId: string, file: File): string {
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const timestamp = Date.now()
  return `${userId}/${timestamp}.${ext}`
}

// ──────────────────────────────────────────────────────────
// Mês anterior e atual para relatórios
// ──────────────────────────────────────────────────────────
export function getMonthOptions(count = 12) {
  const options: { value: string; label: string }[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: d.toISOString().slice(0, 7), // "2025-05"
      label: formatMonthYear(d.toISOString()),
    })
  }
  return options
}
