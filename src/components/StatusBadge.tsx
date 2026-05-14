import { STATUS_CONFIG } from '@/lib/utils'
import type { RecordStatus } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  status: RecordStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        cfg.color, cfg.bg, cfg.border,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      {cfg.label}
    </span>
  )
}
