import { useMemo, useState } from 'react'
import { AddTaskModal } from '../components/AddTaskModal'
import { PriorityBadge } from '../components/PriorityBadge'
import { useStore } from '../context/StoreContext'
import { addDays, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { Priority, Recurrence, Status, Task } from '../types'
import { PROJECTS, TASK_TAGS } from '../types'

const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprog', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
]

const SMART = ['all', 'today', 'tomorrow', 'week', 'inbox', 'overdue', 'done'] as const

export function TasksPage() {
  const { tasks, upsertTask, completeTask, removeTask } = useStore()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [smart, setSmart] = useState<(typeof SMART)[number]>('all')
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('all')
  const [priority, setPriority] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const weekEnd = addDays(today, 7)

  const filtered = useMemo(() => {
    return tasks
      .filter((task) => task.title.toLowerCase().includes(query.toLowerCase()))
      .filter((task) => (project === 'all' ? true : task.project === project))
      .filter((task) => (priority === 'all' ? true : task.priority === priority))
      .filter((task) => {
        if (smart === 'today') return task.dueDate === today && !task.done
        if (smart === 'tomorrow') return task.dueDate === tomorrow && !task.done
        if (smart === 'week') return task.dueDate >= today && task.dueDate <= weekEnd && !task.done
        if (smart === 'inbox') return !task.dueDate && !task.done
        if (smart === 'overdue') return Boolean(task.dueDate && task.dueDate < today && !task.done)
        if (smart === 'done') return task.done
        return true
      })
      .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt)
  }, [priority, project, query, smart, tasks, today, tomorrow, weekEnd])

  function moveTask(task: Task, status: Status) {
    void upsertTask({ ...task, status, done: status === 'completed' })
  }

  const openTask = tasks.find((task) => task.id === openId)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>Lists</p>
          <h1 className={titleClass}>Tasks & Projects</h1>
        </div>
        <div className="flex rounded-2xl bg-field p-1 ring-1 ring-line">
          {(['list', 'kanban'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`min-h-10 rounded-xl px-4 text-sm capitalize ${view === mode ? 'bg-indigo-500 text-white' : 'text-muted'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SMART.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSmart(item)}
            className={`min-h-10 rounded-full px-3 text-xs capitalize ${smart === item ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="glass grid gap-3 rounded-3xl p-4 md:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" className={fieldClass} />
        <select value={project} onChange={(event) => setProject(event.target.value)} className={fieldClass}>
          <option value="all">All lists</option>
          {PROJECTS.map((item) => (
            <option key={item} value={item}>
              #{item}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)} className={fieldClass}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="flex min-h-14 w-full items-center justify-center rounded-3xl bg-indigo-500 text-sm font-medium text-white"
      >
        Add task
      </button>

      {view === 'list' ? (
        <div className="space-y-2">
          {filtered.map((task) => (
            <article key={task.id} className="glass rounded-3xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label className="flex min-h-11 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => void completeTask(task)}
                    className="h-5 w-5 accent-indigo-400"
                  />
                  <div>
                    <p className={`text-sm ${task.done ? 'text-faint line-through' : 'text-fg'}`}>{task.title}</p>
                    <p className="font-mono mt-1 text-[11px] text-faint">
                      #{task.project}
                      {task.dueDate ? ` · ${task.dueDate}` : ''}
                      {task.recurrence !== 'none' ? ` · ${task.recurrence}` : ''}
                      {task.subtasks.length ? ` · ${task.subtasks.filter((item) => item.done).length}/${task.subtasks.length}` : ''}
                    </p>
                  </div>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <button type="button" onClick={() => setOpenId(openId === task.id ? null : task.id)} className="min-h-11 rounded-xl px-3 text-xs text-muted ring-1 ring-line">
                    Details
                  </button>
                  <button type="button" onClick={() => void removeTask(task.id)} className="min-h-11 rounded-xl px-3 text-xs text-rose-400">
                    Delete
                  </button>
                </div>
              </div>
              {openId === task.id && openTask && (
                <TaskDetails task={openTask} onChange={(next) => void upsertTask(next)} />
              )}
            </article>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted">No tasks in this list.</p>}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {STATUSES.map((column) => (
            <section
              key={column.id}
              className="glass min-h-72 rounded-3xl p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const id = event.dataTransfer.getData('text/plain')
                const task = tasks.find((item) => item.id === id)
                if (task) moveTask(task, column.id)
              }}
            >
              <h2 className="px-2 pb-3 text-sm font-semibold text-fg">{column.label}</h2>
              <div className="space-y-2">
                {filtered
                  .filter((task) => task.status === column.id)
                  .map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
                      className="rounded-2xl bg-field p-3 ring-1 ring-line"
                    >
                      <p className="text-sm text-fg">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-faint">#{task.project}</span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
      <AddTaskModal
        open={addOpen}
        initialDueDate={smart === 'tomorrow' ? tomorrow : smart === 'inbox' ? '' : today}
        onClose={() => setAddOpen(false)}
      />
    </div>
  )
}

function TaskDetails({ task, onChange }: { task: Task; onChange: (task: Task) => void }) {
  const [sub, setSub] = useState('')
  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={task.status}
          onChange={(event) => onChange({ ...task, status: event.target.value as Status, done: event.target.value === 'completed' })}
          className={fieldClass}
        >
          {STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          value={task.priority}
          onChange={(event) => onChange({ ...task, priority: event.target.value as Priority })}
          className={fieldClass}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={task.recurrence}
          onChange={(event) => onChange({ ...task, recurrence: event.target.value as Recurrence })}
          className={fieldClass}
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="weekdays">Weekdays</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="date"
          value={task.dueDate}
          onChange={(event) => onChange({ ...task, dueDate: event.target.value })}
          className={fieldClass}
        />
        <select
          value={task.project}
          onChange={(event) => onChange({ ...task, project: event.target.value })}
          className={fieldClass}
        >
          {PROJECTS.map((item) => (
            <option key={item} value={item}>
              #{item}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {TASK_TAGS.map((tag) => {
          const on = task.tags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() =>
                onChange({
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
      <div className="space-y-2">
        {task.subtasks.map((item) => (
          <label key={item.id} className="flex min-h-10 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() =>
                onChange({
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === item.id ? { ...subtask, done: !subtask.done } : subtask,
                  ),
                })
              }
            />
            <span className={item.done ? 'text-faint line-through' : 'text-fg'}>{item.title}</span>
          </label>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!sub.trim()) return
            onChange({
              ...task,
              subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: sub.trim(), done: false }],
            })
            setSub('')
          }}
        >
          <input value={sub} onChange={(event) => setSub(event.target.value)} placeholder="Add checklist item" className={`${fieldClass} flex-1`} />
          <button type="submit" className="min-h-11 rounded-2xl px-4 text-sm text-indigo-400 ring-1 ring-line">
            Add
          </button>
        </form>
      </div>
      <textarea
        value={task.notes}
        onChange={(event) => onChange({ ...task, notes: event.target.value })}
        placeholder="Notes"
        className={`${fieldClass} min-h-20 w-full py-3`}
      />
    </div>
  )
}
