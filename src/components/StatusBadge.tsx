import type { RecordStatus } from '@/types/database'

interface Props {
  status: RecordStatus
  size?: 'sm' | 'md'
}

const CONFIG: Record<RecordStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'PENDENTE',  color: 'var(--warning)', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.25)'  },
  approved: { label: 'APROVADO',  color: 'var(--success)', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.25)'  },
  rejected: { label: 'REPROVADO', color: 'var(--danger)',  bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.25)'  },
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 font-bold rounded-full"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        padding: size === 'sm' ? '2px 10px' : '4px 14px',
        fontSize: size === 'sm' ? '10px' : '11px',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}
