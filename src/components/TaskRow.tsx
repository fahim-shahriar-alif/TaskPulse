import type { ReactNode } from 'react'
import { useStore } from '../context/StoreContext'
import { STATUS_SIGNAL, boardColumn, statusLabel } from '../lib/status'
import type { Status, Task } from '../types'
import { Check } from './Check'
import { PriorityBadge } from './PriorityBadge'
import { useTaskDetail } from './TaskDetailModal'

export function StatusChip({ status }: { status: Status }) {
  const tone = STATUS_SIGNAL[status]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${tone.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {statusLabel(status)}
    </span>
  )
}

export function TaskRow({
  task,
  subtitle,
  showPriority = true,
  showStatus = true,
  trailing,
  className = '',
}: {
  task: Task
  subtitle?: string
  showPriority?: boolean
  showStatus?: boolean
  trailing?: ReactNode
  className?: string
}) {
  const { openTask } = useTaskDetail()
  const { completeTask } = useStore()

  return (
    <div
      className={`flex min-h-12 items-center gap-3 rounded-2xl bg-field px-3 ring-1 ring-line transition active:scale-[0.99] ${className}`}
    >
      <Check
        checked={task.done}
        onChange={() => void completeTask(task)}
        label={`Mark ${task.title} done`}
      />
      <button
        type="button"
        onClick={() => openTask(task.id)}
        className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 text-left touch-manipulation"
      >
        <div className="min-w-0 flex-1">
          <p className={`text-sm ${task.done ? 'text-faint line-through' : 'text-fg'}`}>{task.title}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] text-faint">{subtitle}</p> : null}
        </div>
        {showStatus ? <StatusChip status={boardColumn(task)} /> : null}
        {showPriority ? <PriorityBadge priority={task.priority} /> : null}
        {trailing}
      </button>
    </div>
  )
}
