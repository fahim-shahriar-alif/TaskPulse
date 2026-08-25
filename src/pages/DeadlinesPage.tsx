import { useState } from 'react'
import { DeadlineModal } from '../components/DeadlineModal'
import { useStore } from '../context/StoreContext'
import {
  deadlineKindLabel,
  formatDaysLeft,
  pastDeadlines,
  upcomingDeadlines,
} from '../lib/deadlines'
import { todayKey } from '../lib/dates'
import { eyebrowClass, titleClass } from '../lib/ui'
import type { Deadline } from '../types'

function Row({
  item,
  today,
  onEdit,
  onRemove,
}: {
  item: Deadline
  today: string
  onEdit: (item: Deadline) => void
  onRemove: (id: string) => void
}) {
  const left = formatDaysLeft(item.date, today)
  const soon = item.date <= today
  return (
    <article className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-indigo-400">{deadlineKindLabel(item.kind)}</p>
          <h2 className="mt-1 text-lg font-semibold text-fg">{item.title}</h2>
          <p className="font-mono mt-1 text-xs text-faint">{item.date}</p>
        </div>
        <p className={`font-mono text-sm font-semibold ${soon ? 'text-rose-400' : 'text-fg'}`}>{left}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="min-h-11 flex-1 rounded-2xl bg-field text-sm text-fg ring-1 ring-line"
        >
          Edit
        </button>
        <button type="button" onClick={() => onRemove(item.id)} className="min-h-11 rounded-2xl px-4 text-sm text-rose-400">
          Delete
        </button>
      </div>
    </article>
  )
}

export function DeadlinesPage() {
  const { deadlines, removeDeadline } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Deadline | null>(null)
  const today = todayKey()
  const upcoming = upcomingDeadlines(deadlines, today)
  const past = pastDeadlines(deadlines, today)

  function edit(item?: Deadline) {
    setEditing(item ?? null)
    setOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>University</p>
          <h1 className={titleClass}>Exams & deadlines</h1>
          <p className="mt-2 text-sm text-muted">Pin a few dates so My Day always shows how many days are left.</p>
        </div>
        <button
          type="button"
          onClick={() => edit()}
          className="min-h-11 rounded-2xl bg-indigo-500 px-4 text-sm font-medium text-white"
        >
          Pin a date
        </button>
      </div>

      {upcoming.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {upcoming.map((item) => (
            <Row
              key={item.id}
              item={item}
              today={today}
              onEdit={edit}
              onRemove={(id) => void removeDeadline(id)}
            />
          ))}
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="glass rounded-3xl p-6 text-center">
          <p className="text-sm text-muted">No upcoming exams or deadlines. Pin a midterm or assignment date.</p>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-fg">Past</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {past.map((item) => (
              <Row
                key={item.id}
                item={item}
                today={today}
                onEdit={edit}
                onRemove={(id) => void removeDeadline(id)}
              />
            ))}
          </div>
        </div>
      )}

      <DeadlineModal open={open} initial={editing} onClose={() => setOpen(false)} />
    </div>
  )
}
