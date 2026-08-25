import { useMemo, useState } from 'react'
import { PriorityBadge } from '../components/PriorityBadge'
import { newTask, useStore } from '../context/StoreContext'
import type { Priority, Status, Task } from '../types'
import { PROJECTS } from '../types'

const STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'inprog', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
]

export function TasksPage() {
  const { tasks, upsertTask, removeTask } = useStore()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('all')
  const [priority, setPriority] = useState('all')
  const [due, setDue] = useState('')
  const [title, setTitle] = useState('')

  const filtered = useMemo(() => {
    return tasks
      .filter((task) => task.title.toLowerCase().includes(query.toLowerCase()))
      .filter((task) => (project === 'all' ? true : task.project === project))
      .filter((task) => (priority === 'all' ? true : task.priority === priority))
      .filter((task) => (due ? task.dueDate === due : true))
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [due, priority, project, query, tasks])

  function addTask() {
    const next = title.trim()
    if (!next) return
    void upsertTask(
      newTask({
        title: next,
        project: project === 'all' ? 'Personal' : project,
        priority: priority === 'all' ? 'medium' : (priority as Priority),
        dueDate: due,
      }),
    )
    setTitle('')
  }

  function moveTask(task: Task, status: Status) {
    void upsertTask({
      ...task,
      status,
      done: status === 'completed',
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-indigo-300/80 uppercase">Work</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">Tasks & Projects</h1>
        </div>
        <div className="flex rounded-2xl bg-slate-900 p-1 ring-1 ring-white/10">
          {(['list', 'kanban'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`min-h-10 rounded-xl px-4 text-sm capitalize ${view === mode ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="glass grid gap-3 rounded-3xl p-4 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks"
          className="min-h-11 rounded-2xl bg-slate-950/50 px-4 text-sm outline-none ring-1 ring-white/10"
        />
        <select
          value={project}
          onChange={(event) => setProject(event.target.value)}
          className="min-h-11 rounded-2xl bg-slate-950/50 px-3 text-sm outline-none ring-1 ring-white/10"
        >
          <option value="all">All projects</option>
          {PROJECTS.map((item) => (
            <option key={item} value={item}>
              #{item}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="min-h-11 rounded-2xl bg-slate-950/50 px-3 text-sm outline-none ring-1 ring-white/10"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="date"
          value={due}
          onChange={(event) => setDue(event.target.value)}
          className="min-h-11 rounded-2xl bg-slate-950/50 px-3 text-sm outline-none ring-1 ring-white/10"
        />
      </div>

      <form
        className="glass flex flex-col gap-2 rounded-3xl p-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          addTask()
        }}
      >
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task title"
          className="min-h-11 flex-1 rounded-2xl bg-transparent px-4 text-sm outline-none"
        />
        <button type="submit" className="min-h-11 rounded-2xl bg-indigo-500 px-5 text-sm font-medium text-white">
          Add task
        </button>
      </form>

      {view === 'list' ? (
        <div className="space-y-2">
          {filtered.map((task) => (
            <article key={task.id} className="glass rounded-3xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label className="flex min-h-11 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.done || task.status === 'completed'}
                    onChange={() => moveTask(task, task.status === 'completed' ? 'todo' : 'completed')}
                    className="h-5 w-5 accent-indigo-400"
                  />
                  <div>
                    <p className={`text-sm ${task.done ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
                    <p className="font-mono mt-1 text-[11px] text-slate-500">
                      #{task.project} {task.dueDate ? `· ${task.dueDate}` : ''}
                    </p>
                  </div>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <select
                    value={task.status}
                    onChange={(event) => moveTask(task, event.target.value as Status)}
                    className="min-h-11 rounded-xl bg-slate-950/60 px-2 text-xs outline-none ring-1 ring-white/10"
                  >
                    {STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={task.priority}
                    onChange={(event) => void upsertTask({ ...task, priority: event.target.value as Priority })}
                    className="min-h-11 rounded-xl bg-slate-950/60 px-2 text-xs outline-none ring-1 ring-white/10"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void removeTask(task.id)}
                    className="min-h-11 rounded-xl px-3 text-xs text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <textarea
                value={task.notes}
                onChange={(event) => void upsertTask({ ...task, notes: event.target.value })}
                placeholder="Notes or subtasks"
                className="mt-3 min-h-16 w-full rounded-2xl bg-slate-950/40 p-3 text-sm outline-none ring-1 ring-white/10"
              />
            </article>
          ))}
          {filtered.length === 0 && <p className="text-sm text-slate-500">No tasks match these filters.</p>}
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
              <h2 className="px-2 pb-3 text-sm font-semibold text-slate-200">{column.label}</h2>
              <div className="space-y-2">
                {filtered
                  .filter((task) => task.status === column.id)
                  .map((task) => (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
                      className="rounded-2xl bg-slate-950/50 p-3 ring-1 ring-white/10"
                    >
                      <p className="text-sm text-white">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-slate-500">#{task.project}</span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
