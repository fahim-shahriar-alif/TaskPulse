import { useMemo, useRef, useState, type DragEvent } from 'react'
import { AddTaskModal } from '../components/AddTaskModal'
import { Check } from '../components/Check'
import { PriorityBadge } from '../components/PriorityBadge'
import { StatusChip, TaskRow } from '../components/TaskRow'
import { useTaskDetail } from '../components/TaskDetailModal'
import { useStore } from '../context/StoreContext'
import { addDays, todayKey } from '../lib/dates'
import { boardColumn, STATUS_SIGNAL } from '../lib/status'
import { buildTaskDateGroups } from '../lib/taskDates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { Status, Task } from '../types'
import { PROJECTS, TASK_STATUSES } from '../types'

const SMART = ['all', 'today', 'tomorrow', 'week', 'inbox', 'overdue', 'done'] as const

export function TasksPage() {
  const { tasks, upsertTask, removeTask, completeTask } = useStore()
  const { openTask } = useTaskDetail()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [smart, setSmart] = useState<(typeof SMART)[number]>('all')
  const [query, setQuery] = useState('')
  const [project, setProject] = useState('all')
  const [priority, setPriority] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [addDate, setAddDate] = useState<string | undefined>()
  const [overId, setOverId] = useState<string | null>(null)
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

  const groups = useMemo(() => {
    const fillDays = smart === 'all' ? 7 : smart === 'week' ? 8 : 0
    return buildTaskDateGroups(filtered, today, { fillDays })
  }, [filtered, smart, today])

  function moveTask(task: Task, status: Status) {
    void upsertTask({ ...task, status, done: status === 'completed' })
  }

  function moveToDate(task: Task, dueDate: string) {
    if (task.dueDate === dueDate) return
    void upsertTask({ ...task, dueDate })
  }

  function openAdd(dueDate?: string) {
    setAddDate(dueDate)
    setAddOpen(true)
  }

  function dropOnDate(event: DragEvent, dueDate: string | null) {
    event.preventDefault()
    setOverId(null)
    if (dueDate === null) return
    const id = event.dataTransfer.getData('text/plain')
    const task = tasks.find((item) => item.id === id)
    if (task) moveToDate(task, dueDate)
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>Lists</p>
          <h1 className={titleClass}>Tasks & Projects</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Grouped by due date. Change the date or drop a task on another day to move it.
          </p>
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
        onClick={() => openAdd(smart === 'tomorrow' ? tomorrow : smart === 'inbox' ? '' : today)}
        className="flex min-h-14 w-full items-center justify-center rounded-3xl bg-indigo-500 text-sm font-medium text-white"
      >
        Add task
      </button>

      {view === 'list' ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <section
              key={group.id}
              onDragOver={(event) => {
                if (group.dueDate === null) return
                event.preventDefault()
                setOverId(group.id)
              }}
              onDragLeave={() => setOverId((current) => (current === group.id ? null : current))}
              onDrop={(event) => dropOnDate(event, group.dueDate)}
              className={`space-y-2 rounded-3xl p-1 transition ${overId === group.id ? 'ring-2 ring-indigo-400/70' : ''}`}
            >
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <h2
                    className={`text-sm font-semibold ${group.tone === 'overdue' ? 'text-rose-400' : group.tone === 'today' ? 'text-indigo-400' : 'text-fg'}`}
                  >
                    {group.label}
                    {group.tasks.length ? (
                      <span className="ml-2 font-normal text-faint">{group.tasks.length}</span>
                    ) : null}
                  </h2>
                  {group.hint ? <p className="text-[11px] text-faint">{group.hint}</p> : null}
                </div>
                {group.dueDate !== null ? (
                  <button
                    type="button"
                    onClick={() => openAdd(group.dueDate ?? undefined)}
                    className="min-h-9 text-xs text-indigo-400"
                  >
                    Add
                  </button>
                ) : null}
              </div>
              {group.tasks.length === 0 ? (
                <p className="rounded-3xl bg-field/60 px-4 py-5 text-center text-sm text-muted ring-1 ring-dashed ring-line">
                  {group.dueDate === null ? 'None' : 'Nothing on this day. Drop a task here or add one.'}
                </p>
              ) : (
                group.tasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      dragging.current = true
                      event.dataTransfer.setData('text/plain', task.id)
                    }}
                    onDragEnd={() => {
                      setOverId(null)
                      window.setTimeout(() => {
                        dragging.current = false
                      }, 0)
                    }}
                  >
                    <TaskRow
                      task={task}
                      showStatus={false}
                      className="min-h-14 flex-wrap rounded-3xl"
                      subtitle={[
                        `#${task.project}`,
                        task.recurrence !== 'none' ? task.recurrence : '',
                        task.subtasks.length
                          ? `${task.subtasks.filter((item) => item.done).length}/${task.subtasks.length}`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      trailing={
                        <div className="flex shrink-0 items-center gap-1">
                          <input
                            type="date"
                            value={task.dueDate}
                            aria-label={`Move ${task.title} to another day`}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => moveToDate(task, event.target.value)}
                            className="min-h-10 max-w-36 rounded-xl bg-card px-2 text-[11px] text-fg outline-none ring-1 ring-line"
                          />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              void removeTask(task.id)
                            }}
                            className="min-h-11 rounded-xl px-2 text-xs text-rose-400"
                          >
                            Delete
                          </button>
                        </div>
                      }
                    />
                  </div>
                ))
              )}
            </section>
          ))}
          {groups.length === 0 && <p className="text-sm text-muted">No tasks in this list.</p>}
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
              <h2 className="flex items-center gap-2 px-2 pb-3 text-sm font-semibold text-fg">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_SIGNAL[column.id].dot}`} />
                {column.label}
              </h2>
              <div className="space-y-2">
                {filtered
                  .filter((task) => boardColumn(task) === column.id)
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
                      className="cursor-pointer rounded-2xl bg-field p-3 ring-1 ring-line transition active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-2">
                        <Check
                          checked={boardColumn(task) === 'completed'}
                          onChange={() => void completeTask(task)}
                          label={`Mark ${task.title} done`}
                        />
                        <p className={`min-w-0 flex-1 text-sm ${task.done ? 'text-faint line-through' : 'text-fg'}`}>
                          {task.title}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 pl-7">
                        <span className="font-mono text-[11px] text-faint">
                          #{task.project}
                          {task.dueDate ? ` · ${task.dueDate}` : ''}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusChip status={boardColumn(task)} />
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
        initialDueDate={addDate ?? (smart === 'tomorrow' ? tomorrow : smart === 'inbox' ? '' : today)}
        onClose={() => {
          setAddOpen(false)
          setAddDate(undefined)
        }}
      />
    </div>
  )
}
