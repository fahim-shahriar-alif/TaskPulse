import type { Priority } from '../types'

const styles: Record<Priority, string> = {
  high: 'bg-rose-500/15 text-rose-600 ring-rose-400/45 dark:text-rose-200',
  medium: 'bg-amber-50 text-amber-600 ring-amber-400/45 dark:bg-amber-500/15 dark:text-amber-200',
  low: 'bg-sky-50 text-sky-700 ring-sky-400/45 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30',
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
