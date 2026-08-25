import { useMemo, useRef, useState } from 'react'
import { AddTaskModal } from '../components/AddTaskModal'
import { PriorityBadge } from '../components/PriorityBadge'
import { StatusChip, TaskRow } from '../components/TaskRow'
import { useTaskDetail } from '../components/TaskDetailModal'
import { useStore } from '../context/StoreContext'
import { addDays, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { Status, Task } from '../types'
import { PROJECTS, TASK_STATUSES } from '../types'

const SMART = ['all', 'today', 'tomorrow', 'week', 'inbox', 'overdue', 'done'] as const

export function TasksPage() {
  const { tasks, upsertTask, removeTask } = useStore()
  const { openTask } = useTaskDetail()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [smart, setSmart] = useState<(typeof SMART)[number]>('all')
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('all')
  const [priority, setPriority] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const dragging = useRef(false)
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
            <TaskRow
              key={task.id}
              task={task}
              className="min-h-14 rounded-3xl"
              subtitle={[
                `#${task.project}`,
                task.dueDate,
                task.recurrence !== 'none' ? task.recurrence : '',
                task.subtasks.length
                  ? `${task.subtasks.filter((item) => item.done).length}/${task.subtasks.length}`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void removeTask(task.id)
                  }}
                  className="min-h-11 rounded-xl px-3 text-xs text-rose-400"
                >
                  Delete
                </button>
              }
            />
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted">No tasks in this list.</p>}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {TASK_STATUSES.map((column) => (
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
                      onDragStart={(event) => {
                        dragging.current = true
                        event.dataTransfer.setData('text/plain', task.id)
                      }}
                      onDragEnd={() => {
                        window.setTimeout(() => {
                          dragging.current = false
                        }, 0)
                      }}
                      onClick={() => {
                        if (dragging.current) return
                        openTask(task.id)
                      }}
                      className="cursor-pointer rounded-2xl bg-field p-3 ring-1 ring-line"
                    >
                      <p className="text-sm text-fg">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-faint">#{task.project}</span>
                        <div className="flex items-center gap-2">
                          <StatusChip status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
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
