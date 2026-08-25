import { useEffect, useState } from 'react'
import { newTask, useStore } from '../context/StoreContext'
import { todayKey } from '../lib/dates'
import { fieldClass } from '../lib/ui'
import type { Priority, Recurrence } from '../types'
import { PROJECTS, TASK_TAGS } from '../types'

type AddTaskModalProps = {
  open: boolean
  initialDueDate?: string
  onClose: () => void
}

const empty = {
  title: '',
  project: 'Personal',
  priority: 'medium' as Priority,
  dueDate: todayKey(),
  recurrence: 'none' as Recurrence,
  tags: [] as string[],
  notes: '',
}

export function AddTaskModal({ open, initialDueDate, onClose }: AddTaskModalProps) {
  const { upsertTask } = useStore()
  const [draft, setDraft] = useState(empty)

  useEffect(() => {
    if (!open) return
    setDraft({
      ...empty,
      dueDate: initialDueDate ?? todayKey(),
    })
  }, [initialDueDate, open])

  if (!open) return null

  function close() {
    setDraft(empty)
    onClose()
  }

  function save() {
    const title = draft.title.trim()
    if (!title) return
    void upsertTask(
      newTask({
        title,
        project: draft.project,
        priority: draft.priority,
        dueDate: draft.dueDate,
        recurrence: draft.recurrence,
        tags: draft.tags,
        notes: draft.notes,
      }),
    )
    close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close" onClick={close} />
      <div className="glass relative max-h-[90dvh] w-full max-w-lg overflow-auto rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">Add task</h2>
          <button type="button" onClick={close} className="min-h-11 rounded-xl px-3 text-sm text-muted hover:text-fg">
            Close
          </button>
        </div>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <label className="block text-xs text-muted">
            Task name
            <input
              autoFocus
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="What do you need to do?"
              className={`${fieldClass} mt-1 min-h-12 w-full`}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted">
              List
              <select
                value={draft.project}
                onChange={(event) => setDraft((current) => ({ ...current, project: event.target.value }))}
                className={`${fieldClass} mt-1 w-full`}
              >
                {PROJECTS.map((item) => (
                  <option key={item} value={item}>
                    #{item}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted">
              Priority
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, priority: event.target.value as Priority }))
                }
                className={`${fieldClass} mt-1 w-full`}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="text-xs text-muted">
              Due date
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                className={`${fieldClass} mt-1 w-full`}
              />
            </label>
            <label className="text-xs text-muted">
              Repeat
              <select
                value={draft.recurrence}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, recurrence: event.target.value as Recurrence }))
                }
                className={`${fieldClass} mt-1 w-full`}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Weekdays</option>
              </select>
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted">Tags</p>
            <div className="flex flex-wrap gap-2">
              {TASK_TAGS.map((tag) => {
                const on = draft.tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        tags: on ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
                      }))
                    }
                    className={`min-h-9 rounded-full px-3 text-xs ${on ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'}`}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>
          </div>
          <label className="block text-xs text-muted">
            Notes
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional notes or subtask reminders"
              className={`${fieldClass} mt-1 min-h-20 w-full py-3`}
            />
          </label>
          <button
            type="submit"
            disabled={!draft.title.trim()}
            className="min-h-12 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white disabled:opacity-40"
          >
            Save task
          </button>
        </form>
      </div>
    </div>
  )
}
