import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import { useStore } from '../context/StoreContext'
import { emptyDeadline, normalizeDeadline } from '../lib/deadlines'
import { fieldClass } from '../lib/ui'
import type { Deadline } from '../types'
import { DEADLINE_KINDS } from '../types'

export function DeadlineModal({
  open,
  initial,
  onClose,
}: {
  open: boolean
  initial?: Deadline | null
  onClose: () => void
}) {
  const { upsertDeadline } = useStore()
  const [draft, setDraft] = useState(emptyDeadline)

  useEffect(() => {
    if (!open) return
    setDraft(initial ? { ...initial } : emptyDeadline())
  }, [initial, open])

  if (!open) return null

  return (
    <Modal open={open} title={initial ? 'Edit date' : 'Pin a date'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!draft.title.trim() || !draft.date) return
          void upsertDeadline(normalizeDeadline({ ...draft, title: draft.title.trim() }))
          onClose()
        }}
      >
        <input
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="Midterm, essay, quiz…"
          className={`${fieldClass} w-full`}
          required
        />
        <label className="block text-xs text-muted">
          Date
          <input
            type="date"
            value={draft.date}
            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
            className={`${fieldClass} mt-1 w-full`}
            required
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {DEADLINE_KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDraft({ ...draft, kind: item.id })}
              className={`min-h-10 rounded-full px-3 text-xs ${
                draft.kind === item.id ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="submit" className="min-h-11 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white">
          Save
        </button>
      </form>
    </Modal>
  )
}
