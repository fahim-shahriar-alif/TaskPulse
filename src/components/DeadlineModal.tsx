import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Modal } from './Modal'
import { useStore } from '../context/StoreContext'
import { emptyDeadline, normalizeDeadline } from '../lib/deadlines'
import { fieldClass } from '../lib/ui'
import type { Deadline } from '../types'
import { DEADLINE_KINDS } from '../types'

export function DeadlineModal({
  open,
  initial,
  classId,
  onClose,
}: {
  open: boolean
  initial?: Deadline | null
  classId?: string
  onClose: () => void
}) {
  const { classes, upsertDeadline } = useStore()
  const [draft, setDraft] = useState(() => emptyDeadline(classId))
  const sorted = [...classes].sort((a, b) => a.name.localeCompare(b.name))
  const needsClass = draft.kind === 'exam'
  const canSave = Boolean(draft.date) && (draft.classId || draft.title.trim()) && (!needsClass || draft.classId)

  useEffect(() => {
    if (!open) return
    setDraft(initial ? { ...initial } : emptyDeadline(classId))
  }, [classId, initial, open])

  if (!open) return null

  return (
    <Modal open={open} title={initial ? 'Edit exam' : 'Add exam'} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!canSave) return
          void upsertDeadline(normalizeDeadline({ ...draft, title: draft.title.trim() }))
          onClose()
        }}
      >
        {sorted.length === 0 ? (
          <p className="rounded-2xl bg-field px-4 py-3 text-sm text-muted ring-1 ring-line">
            Add a class first, then pin the exam against it.{' '}
            <Link to="/classes" className="text-indigo-400" onClick={onClose}>
              Go to Classes
            </Link>
          </p>
        ) : (
          <label className="block text-xs text-muted">
            Class
            <select
              value={draft.classId}
              onChange={(event) => setDraft({ ...draft, classId: event.target.value })}
              className={`${fieldClass} mt-1 w-full`}
              required={needsClass}
            >
              <option value="">{needsClass ? 'Choose a class' : 'No class'}</option>
              {sorted.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.course ? ` (${item.course})` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
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
        <input
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="Midterm, quiz, final… (optional)"
          className={`${fieldClass} w-full`}
        />
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
        <button
          type="submit"
          disabled={!canSave}
          className="min-h-11 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white disabled:opacity-40"
        >
          Save
        </button>
      </form>
    </Modal>
  )
}
