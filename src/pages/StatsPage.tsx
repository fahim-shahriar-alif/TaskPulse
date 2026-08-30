import { useMemo } from 'react'
import { CompletionRing } from '../components/CompletionRing'
import { BarChart, DonutPie, ProgressBar } from '../components/Charts'
import { useStore } from '../context/StoreContext'
import { classMeetsOn } from '../lib/classes'
import { addDays, habitStreak, parseKey, startOfWeek, todayKey } from '../lib/dates'
import { deadlineHeadline, daysUntil, upcomingDeadlines } from '../lib/deadlines'
import { eyebrowClass, titleClass } from '../lib/ui'
import { PROJECTS } from '../types'
import type { Task } from '../types'

const PROJECT_COLORS: Record<string, string> = {
  Work: '#0ea5e9',
  Study: '#8b5cf6',
  Personal: '#f472b6',
  Health: '#34d399',
}

function isDone(task: Task) {
  return task.done || task.status === 'completed'
}

function weekdayLabel(key: string) {
  return parseKey(key).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)
}

export function StatsPage() {
  const { tasks, habits, sessions, classes, deadlines } = useStore()
  const today = todayKey()
  const weekStart = startOfWeek()
  const weekEnd = addDays(weekStart, 6)
  const last14 = useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(today, index - 13)), [today])
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)), [today])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])

  const done = tasks.filter(isDone)
  const open = tasks.filter((task) => !isDone(task))
  const todo = open.filter((task) => task.status !== 'inprog')
  const inprog = open.filter((task) => task.status === 'inprog')
  const overdue = open.filter((task) => task.dueDate && task.dueDate < today)
  const dueToday = open.filter((task) => task.dueDate === today)
  const doneToday = done.filter((task) => task.dueDate === today)
  const dueThisWeek = tasks.filter((task) => task.dueDate >= weekStart && task.dueDate <= weekEnd)
  const doneThisWeek = dueThisWeek.filter(isDone)
  const completedWeek = done.filter((task) => task.dueDate >= weekStart).length
  const focusWeek = sessions.filter((item) => item.date >= weekStart).reduce((sum, item) => sum + item.minutes, 0)
  const focusAll = sessions.reduce((sum, item) => sum + item.minutes, 0)
  const bestStreak = Math.max(0, ...habits.map((habit) => habitStreak(habit.completions)))
  const upcoming = upcomingDeadlines(deadlines, today)
  const classesThisWeek = weekDays.reduce(
    (sum, day) => sum + classes.filter((item) => classMeetsOn(item, day)).length,
    0,
  )

  const overallPct = tasks.length ? (done.length / tasks.length) * 100 : 0
  const todayPct = dueToday.length + doneToday.length ? (doneToday.length / (dueToday.length + doneToday.length)) * 100 : 0
  const weekPct = dueThisWeek.length ? (doneThisWeek.length / dueThisWeek.length) * 100 : 0

  const doneByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const task of done) {
      if (!task.dueDate) continue
      map.set(task.dueDate, (map.get(task.dueDate) || 0) + 1)
    }
    return map
  }, [done])

  const focusByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of sessions) map.set(item.date, (map.get(item.date) || 0) + item.minutes)
    return map
  }, [sessions])

  const statusSlices = [
    { id: 'todo', label: 'To do', value: todo.length, color: '#e2e8f0' },
    { id: 'inprog', label: 'In progress', value: inprog.length, color: '#f59e0b' },
    { id: 'completed', label: 'Done', value: done.length, color: '#10b981' },
  ]

  const projectSlices = PROJECTS.map((project) => ({
    id: project,
    label: project,
    value: tasks.filter((task) => task.project === project).length,
    color: PROJECT_COLORS[project],
  }))

  const prioritySlices = [
    { id: 'high', label: 'High', value: tasks.filter((task) => task.priority === 'high').length, color: '#f43f5e' },
    { id: 'medium', label: 'Medium', value: tasks.filter((task) => task.priority === 'medium').length, color: '#f59e0b' },
    { id: 'low', label: 'Low', value: tasks.filter((task) => task.priority === 'low').length, color: '#38bdf8' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className={eyebrowClass}>Pro</p>
        <h1 className={titleClass}>Productivity</h1>
        <p className="mt-2 text-sm text-muted">How the week is going — tasks, focus, habits, and exams in one place.</p>
      </div>

      <div className="kpi-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Open today', String(dueToday.length)],
          ['Done this week', String(completedWeek)],
          ['Focus minutes', String(focusWeek)],
          ['Best streak', String(bestStreak)],
          ['Overdue', String(overdue.length)],
          ['Upcoming exams', String(upcoming.length)],
          ['Classes this week', String(classesThisWeek)],
          ['All focus', String(focusAll)],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-3xl p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-mono mt-2 text-3xl text-fg">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Completion</h2>
          <div className="mt-4">
            <CompletionRing
              value={overallPct}
              label={tasks.length ? `${done.length} of ${tasks.length} tasks done` : 'Add a task to start the ring'}
            />
          </div>
          <div className="mt-5 space-y-3">
            <ProgressBar
              label="Today"
              value={doneToday.length}
              max={dueToday.length + doneToday.length || 1}
              hint={`${Math.round(todayPct)}%`}
              tone="bg-indigo-500"
            />
            <ProgressBar
              label="Due this week"
              value={doneThisWeek.length}
              max={dueThisWeek.length || 1}
              hint={`${Math.round(weekPct)}%`}
              tone="bg-emerald-500"
            />
            <ProgressBar
              label="Overdue vs open"
              value={overdue.length}
              max={open.length || 1}
              hint={`${overdue.length} of ${open.length || 0} open`}
              tone="bg-rose-500"
            />
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Status split</h2>
          <div className="mt-4">
            <DonutPie slices={statusSlices} center={`${tasks.length} tasks`} />
          </div>
        </section>
      </div>

      <section className="glass rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-fg">Tasks finished · last 14 days</h2>
        <div className="mt-4">
          <BarChart
            items={last14.map((day) => ({
              id: day,
              label: day.slice(-2),
              value: doneByDay.get(day) || 0,
            }))}
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Focus minutes · last 7 days</h2>
          <div className="mt-4">
            <BarChart
              tone="bg-cyan-400"
              items={last7.map((day) => ({
                id: day,
                label: weekdayLabel(day),
                value: focusByDay.get(day) || 0,
              }))}
            />
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">By list</h2>
          <div className="mt-4">
            <DonutPie slices={projectSlices} />
          </div>
          <div className="mt-5 space-y-3">
            {PROJECTS.map((project) => {
              const list = tasks.filter((task) => task.project === project)
              const finished = list.filter(isDone).length
              return (
                <ProgressBar
                  key={project}
                  label={project}
                  value={finished}
                  max={list.length || 1}
                  hint={list.length ? `${finished}/${list.length}` : '0'}
                  tone="bg-indigo-500"
                />
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Priority mix</h2>
          <div className="mt-4">
            <DonutPie slices={prioritySlices} />
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Habits this week</h2>
          <div className="mt-4 space-y-3">
            {habits.length === 0 ? (
              <p className="text-sm text-muted">No habits yet. Add one and the week’s bars will fill in.</p>
            ) : (
              habits.map((habit) => {
                const hits = weekDays.filter((day) => habit.completions[day]).length
                return (
                  <ProgressBar
                    key={habit.id}
                    label={habit.name}
                    value={hits}
                    max={7}
                    hint={`${hits}/7 · streak ${habitStreak(habit.completions)}`}
                    tone="bg-amber-400"
                  />
                )
              })
            )}
          </div>
        </section>
      </div>

      {upcoming.length > 0 && (
        <section className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Exam countdown</h2>
          <div className="mt-4 space-y-3">
            {upcoming.slice(0, 6).map((item) => {
              const left = Math.max(0, daysUntil(item.date, today))
              const span = 21
              return (
                <ProgressBar
                  key={item.id}
                  label={deadlineHeadline(item, classes)}
                  value={Math.min(span, Math.max(0, span - left))}
                  max={span}
                  hint={left === 0 ? 'Today' : `${left} days left`}
                  tone={left <= 3 ? 'bg-rose-500' : left <= 7 ? 'bg-amber-400' : 'bg-indigo-500'}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
