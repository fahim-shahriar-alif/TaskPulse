import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useStore } from '../context/StoreContext'
import { STATUS_SIGNAL } from '../lib/status'
import { fieldClass } from '../lib/ui'
import type { Priority, Recurrence, Status, Task } from '../types'
import { PROJECTS, TASK_STATUSES, TASK_TAGS } from '../types'

type TaskDetailContextValue = {
  openTask: (id: string) => void
}

const TaskDetailContext = createContext<TaskDetailContextValue | null>(null)

export function TaskDetailProvider({ children }: { children: ReactNode }) {
  const { tasks } = useStore()
  const [id, setId] = useState<string | null>(null)
  const task = tasks.find((item) => item.id === id) ?? null

  return (
    <TaskDetailContext.Provider value={{ openTask: setId }}>
      {children}
      <TaskDetailModal task={task} onClose={() => setId(null)} />
    </TaskDetailContext.Provider>
  )
}

export function useTaskDetail() {
  const ctx = useContext(TaskDetailContext)
  if (!ctx) throw new Error('useTaskDetail must be used inside TaskDetailProvider')
  return ctx
}

function TaskDetailModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { upsertTask, removeTask, completeTask } = useStore()
  const [sub, setSub] = useState('')

  useEffect(() => {
    if (!task) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [task, onClose])

  if (!task) return null
  const current = task

  function setStatus(status: Status) {
    if (status === 'completed' && !(current.done || current.status === 'completed')) {
      void completeTask(current)
      return
    }
    void upsertTask({ ...current, status, done: status === 'completed' })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close" onClick={onClose} />
      <div className="glass relative max-h-[90dvh] w-full max-w-lg overflow-auto rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">Task details</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm text-muted hover:text-fg">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <input
            value={task.title}
            onChange={(event) => void upsertTask({ ...task, title: event.target.value })}
            className={`${fieldClass} min-h-12 w-full text-base font-medium`}
          />

          <div>
            <p className="mb-2 text-xs text-muted">Current status</p>
            <div className="grid grid-cols-3 gap-2">
              {TASK_STATUSES.map((item) => {
                const on = task.status === item.id
                const tone = STATUS_SIGNAL[item.id]
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatus(item.id)}
                    className={`flex min-h-12 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-medium ${
                      on ? tone.solid : 'bg-field text-muted ring-1 ring-line'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${on ? 'bg-white' : tone.dot}`} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-muted">
              List
              <select
                value={task.project}
                onChange={(event) => void upsertTask({ ...task, project: event.target.value })}
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
                value={task.priority}
                onChange={(event) => void upsertTask({ ...task, priority: event.target.value as Priority })}
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
                value={task.dueDate}
                onChange={(event) => void upsertTask({ ...task, dueDate: event.target.value })}
                className={`${fieldClass} mt-1 w-full`}
              />
            </label>
            <label className="text-xs text-muted">
              Repeat
              <select
                value={task.recurrence}
                onChange={(event) => void upsertTask({ ...task, recurrence: event.target.value as Recurrence })}
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
                const on = task.tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      void upsertTask({
                        ...task,
                        tags: on ? task.tags.filter((item) => item !== tag) : [...task.tags, tag],
                      })
                    }
                    className={`min-h-9 rounded-full px-3 text-xs ${on ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'}`}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted">Checklist</p>
            {task.subtasks.map((item) => (
              <label key={item.id} className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() =>
                    void upsertTask({
                      ...task,
                      subtasks: task.subtasks.map((subtask) =>
                        subtask.id === item.id ? { ...subtask, done: !subtask.done } : subtask,
                      ),
                    })
                  }
                  className="accent-indigo-400"
                />
                <span className={item.done ? 'text-faint line-through' : 'text-fg'}>{item.title}</span>
              </label>
            ))}
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!sub.trim()) return
                void upsertTask({
                  ...task,
                  subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: sub.trim(), done: false }],
                })
                setSub('')
              }}
            >
              <input
                value={sub}
                onChange={(event) => setSub(event.target.value)}
                placeholder="Add checklist item"
                className={`${fieldClass} flex-1`}
              />
              <button type="submit" className="min-h-11 rounded-2xl px-4 text-sm text-indigo-400 ring-1 ring-line">
                Add
              </button>
            </form>
          </div>

          <label className="block text-xs text-muted">
            Notes
            <textarea
              value={task.notes}
              onChange={(event) => void upsertTask({ ...task, notes: event.target.value })}
              placeholder="Notes"
              className={`${fieldClass} mt-1 min-h-20 w-full py-3`}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              void removeTask(task.id)
              onClose()
            }}
            className="min-h-11 w-full rounded-2xl text-sm text-rose-400 ring-1 ring-rose-400/25"
          >
            Delete task
          </button>
        </div>
      </div>
    </div>
  )
}
