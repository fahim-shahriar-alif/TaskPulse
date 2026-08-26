import type { Status } from '../types'
import { TASK_STATUSES } from '../types'

export function statusLabel(status: Status) {
  return TASK_STATUSES.find((item) => item.id === status)?.label ?? status
}

export function boardColumn(task: { status: Status; done: boolean }): Status {
  if (task.done || task.status === 'completed') return 'completed'
  return task.status === 'inprog' ? 'inprog' : 'todo'
}

export const STATUS_SIGNAL: Record<Status, { dot: string; chip: string; solid: string; dotOn: string }> = {
  todo: {
    dot: 'bg-white ring-1 ring-slate-400/80 dark:ring-white/80',
    chip: 'bg-white text-slate-700 ring-1 ring-slate-300 dark:bg-white/15 dark:text-white dark:ring-white/35',
    solid: 'bg-white text-slate-900 ring-1 ring-slate-300',
    dotOn: 'bg-slate-800',
  },
  inprog: {
    dot: 'bg-amber-400',
    chip: 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/40 dark:text-amber-300',
    solid: 'bg-amber-500 text-white',
    dotOn: 'bg-white',
  },
  completed: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/35 dark:text-emerald-300',
    solid: 'bg-emerald-500 text-white',
    dotOn: 'bg-white',
  },
}
