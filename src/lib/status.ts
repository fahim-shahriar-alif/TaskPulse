import type { Status } from '../types'
import { TASK_STATUSES } from '../types'

export function statusLabel(status: Status) {
  return TASK_STATUSES.find((item) => item.id === status)?.label ?? status
}

export const STATUS_SIGNAL: Record<Status, { dot: string; chip: string; solid: string }> = {
  todo: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-500/15 text-rose-600 ring-1 ring-rose-400/35 dark:text-rose-300',
    solid: 'bg-rose-500 text-white',
  },
  inprog: {
    dot: 'bg-amber-400',
    chip: 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/40 dark:text-amber-300',
    solid: 'bg-amber-500 text-white',
  },
  completed: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/35 dark:text-emerald-300',
    solid: 'bg-emerald-500 text-white',
  },
}
