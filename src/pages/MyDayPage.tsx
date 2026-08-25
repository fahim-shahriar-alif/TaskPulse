import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AddTaskModal } from '../components/AddTaskModal'
import { CompletionRing } from '../components/CompletionRing'
import { DeadlineModal } from '../components/DeadlineModal'
import { TaskRow } from '../components/TaskRow'
import { useAuth } from '../context/AuthContext'
import { toggleHabitToday, useStore } from '../context/StoreContext'
import {
  classMoment,
  classesOnDay,
  formatClassCountdown,
  formatClassTime,
  nextClassToday,
  nowMinutes,
} from '../lib/classes'
import { deadlineKindLabel, daysUntil, formatDaysLeft, upcomingDeadlines } from '../lib/deadlines'
import { formatDayLabel, formatHourLabel, habitStreak, todayKey } from '../lib/dates'
import { useNow } from '../lib/now'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'

function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function MyDayPage() {
  const { user } = useAuth()
  const { tasks, habits, day, sessions, classes, deadlines, upsertHabit, saveDay } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const now = useNow()
  const today = todayKey(now)
  const minutes = nowMinutes(now)
  const firstName = (user?.displayName || user?.email || 'there').split(' ')[0].split('@')[0]

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today || (!task.dueDate && !task.done)),
    [tasks, today],
  )
  const overdue = useMemo(
    () => tasks.filter((task) => task.dueDate && task.dueDate < today && !task.done),
    [tasks, today],
  )
  const upcoming = useMemo(
    () =>
      tasks
        .filter((task) => !task.done && task.dueDate && task.dueDate > today)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4),
    [tasks, today],
  )
  const dueToday = todaysTasks.filter((task) => task.dueDate === today)
  const doneCount = dueToday.filter((task) => task.done).length
  const openToday = todaysTasks.filter((task) => !task.done).length
  const pct = dueToday.length ? (doneCount / dueToday.length) * 100 : 0
  const focusToday = sessions.filter((item) => item.date === today).reduce((sum, item) => sum + item.minutes, 0)
  const habitsDone = habits.filter((habit) => habit.completions[today]).length
  const schedule = [...day.schedule].sort((a, b) => a.from.localeCompare(b.from))
  const todayClasses = useMemo(() => classesOnDay(classes, today), [classes, today])
  const nextClass = useMemo(() => nextClassToday(classes, today, minutes), [classes, minutes, today])
  const pinned = useMemo(() => upcomingDeadlines(deadlines, today).slice(0, 4), [deadlines, today])

  const stats = [
    ['Open today', String(openToday)],
    ['Done', String(doneCount)],
    ['Focus', `${focusToday}m`],
    ['Habits', `${habitsDone}/${habits.length || 0}`],
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className={eyebrowClass}>My Day</p>
        <h1 className={titleClass}>{formatDayLabel(now)}</h1>
        <p className="mt-2 text-sm text-muted">
          {greeting(now)}, {firstName}. Here’s your day at a glance.
        </p>
      </div>

      {nextClass && (
        <Link
          to="/classes"
          className="hero-card glass flex min-h-20 items-center justify-between gap-4 rounded-3xl px-5"
        >
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-indigo-400">
              {classMoment(nextClass, minutes) === 'live' ? 'Happening now' : 'Next class'}
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-fg">{nextClass.name}</p>
            <p className="mt-0.5 truncate text-sm text-muted">
              {formatClassTime(nextClass)}
              {nextClass.location ? ` · ${nextClass.location}` : ''}
            </p>
          </div>
          <p className="font-mono shrink-0 text-right text-sm font-semibold text-indigo-400">
            {formatClassCountdown(nextClass, minutes)}
          </p>
        </Link>
      )}

      {todayClasses.length > 0 && !nextClass && (
        <div className="glass rounded-3xl px-5 py-4">
          <p className="text-sm text-muted">Classes are done for today.</p>
        </div>
      )}

      {pinned.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pinned.map((item) => {
            const n = daysUntil(item.date, today)
            const tone = n <= 0 ? 'text-rose-400' : n <= 3 ? 'text-amber-500' : 'text-indigo-400'
            return (
              <Link key={item.id} to="/deadlines" className="glass rounded-3xl p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted">{deadlineKindLabel(item.kind)}</p>
                <p className="mt-1 truncate text-sm font-medium text-fg">{item.title}</p>
                <p className={`font-mono mt-2 text-2xl font-semibold ${tone}`}>{formatDaysLeft(item.date, today)}</p>
              </Link>
            )
          })}
        </div>
      )}

      <div className="kpi-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="glass rounded-3xl p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-mono mt-1 text-2xl font-semibold text-fg">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-5">
          <div className="hero-card glass rounded-3xl p-5">
            <CompletionRing
              value={pct}
              label={
                dueToday.length
                  ? `${doneCount} of ${dueToday.length} dated tasks done · ${focusToday}m focus`
                  : `No dated tasks yet · ${focusToday}m focus`
              }
            />
          </div>

          {overdue.length > 0 && (
            <div className="rounded-3xl bg-rose-500/10 p-4 ring-1 ring-rose-400/20">
              <p className="text-sm font-medium text-rose-500">{overdue.length} overdue</p>
              <div className="mt-2 space-y-2">
                {overdue.map((task) => (
                  <TaskRow key={task.id} task={task} showPriority={false} className="bg-transparent" />
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-3xl bg-indigo-500 text-sm font-medium text-white"
          >
            Add task
          </button>
          <AddTaskModal open={addOpen} initialDueDate={today} onClose={() => setAddOpen(false)} />
          <DeadlineModal open={deadlineOpen} onClose={() => setDeadlineOpen(false)} />

          <div className="glass space-y-3 rounded-3xl p-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-fg">Today’s tasks</h2>
              <Link to="/tasks" className="text-xs text-indigo-400">
                All tasks
              </Link>
            </div>
            {todaysTasks.length === 0 ? (
              <p className="rounded-2xl bg-field px-4 py-6 text-center text-sm text-muted">
                Nothing on the list yet. Add a task to give today a shape.
              </p>
            ) : (
              <div className="space-y-2">
                {todaysTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subtitle={task.project}
                    className="min-h-14"
                  />
                ))}
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <div className="glass space-y-3 rounded-3xl p-4">
              <h2 className="text-sm font-semibold text-fg">Coming up</h2>
              {upcoming.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showPriority={false}
                  subtitle={task.dueDate}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="glass rounded-3xl p-5">
            <h2 className="text-sm font-semibold text-fg">Big 3 non-negotiables</h2>
            <p className="mt-1 text-xs text-faint">Highest-impact goals for today.</p>
            <div className="mt-4 space-y-3">
              {day.big3.map((goal, index) => (
                <input
                  key={index}
                  value={goal}
                  onChange={(event) => {
                    const big3 = [...day.big3] as [string, string, string]
                    big3[index] = event.target.value
                    void saveDay({ big3 })
                  }}
                  placeholder={`Goal ${index + 1}`}
                  className={fieldClass + ' w-full'}
                />
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Today’s classes</h2>
              <Link to="/classes" className="text-xs text-indigo-400">
                All classes
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-muted">No university classes today. Add them in Classes.</p>
              ) : (
                todayClasses.map((item) => {
                  const moment = classMoment(item, minutes)
                  const featured = nextClass?.id === item.id
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl bg-field px-4 py-3 ring-1 ${
                        featured ? 'ring-indigo-400/50' : 'ring-line'
                      } ${moment === 'done' ? 'opacity-55' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-xs text-indigo-400">{formatClassTime(item)}</p>
                        {moment === 'live' && (
                          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                            Live
                          </span>
                        )}
                        {moment === 'upcoming' && featured && (
                          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                            {formatClassCountdown(item, minutes)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-fg">{item.name}</p>
                      {item.location ? <p className="text-xs text-muted">{item.location}</p> : null}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Exams & deadlines</h2>
              <Link to="/deadlines" className="text-xs text-indigo-400">
                All dates
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {pinned.length === 0 ? (
                <p className="text-sm text-muted">Pin a midterm or assignment so the countdown stays here.</p>
              ) : (
                pinned.map((item) => {
                  const n = daysUntil(item.date, today)
                  const tone = n <= 0 ? 'text-rose-400' : n <= 3 ? 'text-amber-500' : 'text-indigo-400'
                  return (
                    <Link
                      key={item.id}
                      to="/deadlines"
                      className="flex min-h-12 items-center justify-between rounded-2xl bg-field px-4 ring-1 ring-line"
                    >
                      <span>
                        <span className="block text-sm text-fg">{item.title}</span>
                        <span className="text-[11px] text-faint">{deadlineKindLabel(item.kind)}</span>
                      </span>
                      <span className={`font-mono text-xs font-semibold ${tone}`}>{formatDaysLeft(item.date, today)}</span>
                    </Link>
                  )
                })
              )}
              <button
                type="button"
                onClick={() => setDeadlineOpen(true)}
                className="flex min-h-11 w-full items-center justify-center rounded-2xl text-sm text-indigo-400 ring-1 ring-line"
              >
                Pin a date
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Today’s schedule</h2>
              <Link to="/schedule" className="text-xs text-indigo-400">
                Edit
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {schedule.length === 0 ? (
                <p className="text-sm text-muted">No ranges yet. Add from–to times on the Schedule page.</p>
              ) : (
                schedule.map((slot) => (
                  <div key={slot.id} className="rounded-2xl bg-field px-4 py-3 ring-1 ring-line">
                    <p className="font-mono text-xs text-indigo-400">
                      {formatHourLabel(slot.from)} – {formatHourLabel(slot.to)}
                    </p>
                    <p className="mt-1 text-sm text-fg">{slot.activity || 'Untitled'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Habit quick-check</h2>
              <Link to="/habits" className="text-xs text-indigo-400">
                All habits
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {habits.map((habit) => {
                const done = Boolean(habit.completions[today])
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => void upsertHabit(toggleHabitToday(habit))}
                    className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-field px-4 text-left ring-1 ring-line"
                  >
                    <span className="text-sm text-fg">{habit.name}</span>
                    <span className="font-mono text-xs text-faint">
                      {done ? 'Done' : `${habitStreak(habit.completions)} day streak`}
                    </span>
                  </button>
                )
              })}
              {habits.length === 0 && <p className="text-sm text-muted">Add habits in the Habits tab.</p>}
            </div>
          </div>

          <Link
            to="/focus"
            className="glass flex min-h-16 items-center justify-between rounded-3xl px-5"
          >
            <span>
              <span className="block text-sm font-medium text-fg">Start a focus session</span>
              <span className="text-xs text-muted">{focusToday} minutes logged today</span>
            </span>
            <span className="text-faint">→</span>
          </Link>
        </section>
      </div>
    </div>
  )
}
