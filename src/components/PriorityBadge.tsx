import type { Priority } from '../types'

const styles: Record<Priority, string> = {
  high: 'bg-rose-500/15 text-rose-200 ring-rose-400/30',
  medium: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  low: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`font-mono rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase ring-1 ${styles[priority]}`}
    >
      {priority}
    </span>
  )
}
