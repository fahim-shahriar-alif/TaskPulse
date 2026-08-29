import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AddTaskModal } from '../components/AddTaskModal'
import { Check } from '../components/Check'
import { CompletionRing } from '../components/CompletionRing'
import { DeadlineModal } from '../components/DeadlineModal'
import { LiveClock } from '../components/LiveClock'
import { TaskRow } from '../components/TaskRow'
import { useAuth } from '../context/AuthContext'
import { toggleHabitToday, useStore } from '../context/StoreContext'
import {
  classKindLabel,
  classMoment,
  classesOnDay,
  formatClassCountdown,
  formatClassTime,
  nextClassToday,
  nowMinutes,
  timeToMinutes,
} from '../lib/classes'
import { notesForClass } from '../lib/classNotes'
import { deadlineDetail, deadlineHeadline, daysUntil, formatDaysLeft, upcomingDeadlines } from '../lib/deadlines'
import { formatDayLabel, formatHourLabel, habitStreak, todayKey } from '../lib/dates'
import { useNow } from '../lib/now'
import { updateSlot, conflictNote } from '../lib/schedule'
import { eyebrowClass, fieldClass } from '../lib/ui'
import type { ScheduleSlot } from '../types'

function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function cardHead(title: string, action: ReactNode) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {action}
    </div>
  )
}

function ScheduleRow({
  slot,
  clash,
  onToggle,
}: {
  slot: ScheduleSlot
  clash: string
  onToggle: () => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-field px-3 py-2.5 ring-1 ring-line transition active:scale-[0.99]">
      <Check
        checked={slot.done}
        onChange={onToggle}
        label={`Mark ${slot.activity || 'schedule block'} done`}
        size="sm"
      />
      <span className="min-w-0 flex-1">
        <span className={`font-mono block text-[11px] ${slot.done ? 'text-faint' : 'text-indigo-400'}`}>
          {formatHourLabel(slot.from)} – {formatHourLabel(slot.to)}
        </span>
        <span className={`mt-0.5 block text-sm ${slot.done ? 'text-faint line-through' : 'text-fg'}`}>
          {slot.activity || 'Untitled'}
          {slot.classId ? <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-indigo-400">Class</span> : null}
        </span>
        {clash && !slot.done ? <span className="mt-0.5 block text-[11px] text-amber-500">{clash}</span> : null}
      </span>
    </div>
  )
}

export function MyDayPage() {
  const { user } = useAuth()
  const { tasks, habits, notes, day, sessions, classes, deadlines, classNotes, upsertHabit, upsertNote, saveDay } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const now = useNow()
  const today = todayKey(now)
  const minutes = nowMinutes(now)
  const firstName = (user?.displayName || user?.email || 'there').split(' ')[0].split('@')[0]

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today || (!task.dueDate && !task.done)),
    [tasks, today],
  )
  const openTasks = todaysTasks.filter((task) => !task.done)
  const doneTasks = todaysTasks.filter((task) => task.done)
  const overdue = useMemo(
    () => tasks.filter((task) => task.dueDate && task.dueDate < today && !task.done),
    [tasks, today],
  )
  const dueToday = todaysTasks.filter((task) => task.dueDate === today)
  const doneCount = dueToday.filter((task) => task.done).length
  const openToday = todaysTasks.filter((task) => !task.done).length
  const pct = dueToday.length ? (doneCount / dueToday.length) * 100 : 0
  const focusToday = sessions.filter((item) => item.date === today).reduce((sum, item) => sum + item.minutes, 0)
  const habitsDone = habits.filter((habit) => habit.completions[today]).length
  const stats = [
    ['Open today', String(openToday)],
    ['Done', String(doneCount)],
    ['Focus', `${focusToday}m`],
    ['Habits', `${habitsDone}/${habits.length || 0}`],
  ]
  const schedule = [...day.schedule].sort((a, b) => a.from.localeCompare(b.from))
  const openSlots = schedule.filter((slot) => !slot.done)
  const doneSlots = schedule.filter((slot) => slot.done)
  const todayClasses = useMemo(() => classesOnDay(classes, today), [classes, today])
  const nextClass = useMemo(() => nextClassToday(classes, today, minutes), [classes, minutes, today])
  const pinned = useMemo(() => upcomingDeadlines(deadlines, today).slice(0, 4), [deadlines, today])
  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3),
    [notes],
  )

  function toggleSlot(id: string, done: boolean) {
    void saveDay({ schedule: updateSlot(day.schedule, id, { done }) })
  }

  const linkClass = 'text-xs text-indigo-400'

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={eyebrowClass}>My Day</p>
          <h1 className="mt-1 text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-fg sm:text-3xl">
            {formatDayLabel(now)}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {greeting(now)}, {firstName}.
          </p>
        </div>
        <LiveClock className="mt-6 shrink-0 text-xl font-semibold text-indigo-400 sm:mt-7 sm:text-3xl sm:text-fg" />
      </div>

      <AddTaskModal open={addOpen} initialDueDate={today} onClose={() => setAddOpen(false)} />
      <DeadlineModal open={deadlineOpen} onClose={() => setDeadlineOpen(false)} />

      <div className="kpi-grid grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl px-3.5 py-3 ring-1 ring-line sm:rounded-3xl sm:p-4">
            <p className="text-[11px] font-medium text-muted sm:text-xs">{label}</p>
            <p className="kpi-value font-mono mt-1 text-[1.65rem] font-semibold leading-none sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <div className="hero-card glass flex flex-col justify-center rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Today’s progress</h2>
          <p className="mt-1 text-xs text-faint">Dated tasks and focus minutes for this day.</p>
          <div className="mt-4">
            <CompletionRing
              value={pct}
              label={
                dueToday.length
                  ? `${doneCount} of ${dueToday.length} dated tasks done · ${focusToday}m focus`
                  : `No dated tasks yet · ${focusToday}m focus`
              }
            />
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Big 3</h2>
          <p className="mt-1 text-xs text-faint">Highest-impact goals for today.</p>
          <div className="mt-3 space-y-2">
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
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          {overdue.length > 0 && (
            <div className="rounded-3xl bg-rose-500/10 p-4 ring-1 ring-rose-400/20">
              <p className="text-sm font-medium text-rose-500">{overdue.length} overdue</p>
              <div className="mt-2 space-y-2">
                {overdue.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showPriority={false}
                    showStatus={false}
                    className="bg-transparent"
                  />
                ))}
              </div>
            </div>
          )}

          <section className="glass space-y-3 rounded-3xl p-5">
            {cardHead(
              'Today’s tasks',
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setAddOpen(true)} className={linkClass}>
                  Add
                </button>
                <Link to="/tasks" className={linkClass}>
                  All
                </Link>
              </div>,
            )}
            {openTasks.length === 0 && doneTasks.length === 0 ? (
              <p className="rounded-2xl bg-field px-4 py-5 text-center text-sm text-muted">
                Nothing on the list yet.
              </p>
            ) : (
              <div className="space-y-2">
                {openTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subtitle={task.project}
                    showPriority={false}
                    showStatus={false}
                    className="min-h-12"
                  />
                ))}
                {openTasks.length === 0 && doneTasks.length > 0 ? (
                  <p className="px-1 text-sm text-muted">All of today’s tasks are done.</p>
                ) : null}
                {doneTasks.length > 0 ? (
                  <details className="rounded-2xl px-1 py-1">
                    <summary className="cursor-pointer text-xs text-muted">Done · {doneTasks.length}</summary>
                    <div className="mt-2 space-y-2">
                      {doneTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          showPriority={false}
                          showStatus={false}
                          className="min-h-11"
                        />
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            )}
          </section>

          <section className="glass space-y-3 rounded-3xl p-5">
            {cardHead(
              'Today’s schedule',
              <Link to="/schedule" className={linkClass}>
                Edit
              </Link>,
            )}
            {schedule.length === 0 ? (
              <p className="text-sm text-muted">No ranges yet. Today’s classes show up here on their own.</p>
            ) : (
              <div className="space-y-2">
                {openSlots.map((slot) => (
                  <ScheduleRow
                    key={slot.id}
                    slot={slot}
                    clash={conflictNote(slot, classes, day.schedule, today)}
                    onToggle={() => toggleSlot(slot.id, !slot.done)}
                  />
                ))}
                {openSlots.length === 0 ? <p className="text-sm text-muted">All blocks checked off.</p> : null}
                {doneSlots.length > 0 ? (
                  <details className="rounded-2xl px-1 py-1">
                    <summary className="cursor-pointer text-xs text-muted">Done · {doneSlots.length}</summary>
                    <div className="mt-2 space-y-2">
                      {doneSlots.map((slot) => (
                        <ScheduleRow
                          key={slot.id}
                          slot={slot}
                          clash=""
                          onToggle={() => toggleSlot(slot.id, !slot.done)}
                        />
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            )}
          </section>

          <section className="glass space-y-3 rounded-3xl p-5">
            {cardHead(
              'Habits',
              <Link to="/habits" className={linkClass}>
                All
              </Link>,
            )}
            <div className="space-y-2">
              {habits.map((habit) => {
                const done = Boolean(habit.completions[today])
                const streak = habitStreak(habit.completions)
                return (
                  <div
                    key={habit.id}
                    className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-field px-3 text-left ring-1 ring-line transition active:scale-[0.99]"
                  >
                    <Check
                      checked={done}
                      onChange={() => void upsertHabit(toggleHabitToday(habit))}
                      label={`Mark ${habit.name} ${done ? 'not done' : 'done'}`}
                    />
                    <button
                      type="button"
                      onClick={() => void upsertHabit(toggleHabitToday(habit))}
                      className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 text-left touch-manipulation"
                    >
                      <span className={`min-w-0 truncate text-sm ${done ? 'text-faint line-through' : 'text-fg'}`}>
                        {habit.name}
                      </span>
                      <span className="font-mono shrink-0 text-xs text-faint">
                        {done ? 'Done' : streak > 0 ? `${streak}d` : ''}
                      </span>
                    </button>
                  </div>
                )
              })}
              {habits.length === 0 && <p className="text-sm text-muted">Add habits in the Habits tab.</p>}
            </div>
          </section>

          <Link to="/focus" className="glass flex min-h-14 items-center justify-between rounded-3xl px-5">
            <span>
              <span className="block text-sm font-medium text-fg">Start a focus session</span>
              <span className="text-xs text-muted">{focusToday} minutes logged today</span>
            </span>
            <span className="text-faint">→</span>
          </Link>
        </div>

        <div className="space-y-5">
          <section className="glass space-y-3 rounded-3xl p-5">
            {cardHead(
              'Today’s classes',
              <Link to="/classes" className={linkClass}>
                All
              </Link>,
            )}
            {todayClasses.length === 0 ? (
              <p className="text-sm text-muted">Nothing on the timetable today.</p>
            ) : (
              <div className="space-y-2">
                {todayClasses.map((item) => {
                  const moment = classMoment(item, minutes)
                  const featured = nextClass?.id === item.id
                  const overnight = timeToMinutes(item.to) <= timeToMinutes(item.from)
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl bg-field px-4 py-3 ring-1 ${
                        featured ? 'ring-indigo-400/40' : 'ring-line'
                      } ${moment === 'done' ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-[11px] text-indigo-400">{formatClassTime(item)}</p>
                        {moment === 'live' ? (
                          <span className="text-[11px] font-medium text-indigo-400">Live</span>
                        ) : null}
                        {moment === 'upcoming' && featured ? (
                          <span className="font-mono text-[11px] text-indigo-400">
                            {formatClassCountdown(item, minutes)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-fg">{item.name}</p>
                      <p className="text-[11px] text-faint">{classKindLabel(item)}</p>
                      {item.location ? <p className="text-xs text-muted">{item.location}</p> : null}
                      {overnight ? (
                        <p className="mt-1 text-[11px] text-muted">Runs past midnight — check the end time.</p>
                      ) : null}
                      <Link
                        to={`/class-notes/${item.id}?date=${today}`}
                        className="mt-2 inline-flex min-h-9 items-center rounded-full bg-card px-3 text-xs text-indigo-400 ring-1 ring-line"
                      >
                        {(() => {
                          const count = notesForClass(classNotes, item.id).length
                          return count ? `Class notes · ${count}` : 'Add class notes'
                        })()}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="glass space-y-3 rounded-3xl p-5">
            {cardHead(
              'Exams & deadlines',
              <Link to="/deadlines" className={linkClass}>
                All
              </Link>,
            )}
            {pinned.length === 0 ? (
              <p className="text-sm text-muted">Pin an exam against a class to keep the countdown here.</p>
            ) : (
              <div className="space-y-2">
                {pinned.map((item) => {
                  const n = daysUntil(item.date, today)
                  const tone = n <= 0 ? 'text-rose-400' : n <= 3 ? 'text-amber-500' : 'text-indigo-400'
                  return (
                    <Link
                      key={item.id}
                      to="/deadlines"
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-field px-4 py-2.5 ring-1 ring-line"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-fg">{deadlineHeadline(item, classes)}</span>
                        <span className="text-[11px] text-faint">{deadlineDetail(item, classes)}</span>
                      </span>
                      <span className={`font-mono shrink-0 text-xs font-semibold ${tone}`}>
                        {formatDaysLeft(item.date, today)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => setDeadlineOpen(true)}
              className="flex min-h-11 w-full items-center justify-center rounded-2xl text-sm text-indigo-400 ring-1 ring-line"
            >
              Pin an exam
            </button>
          </section>

          <section className="glass space-y-3 rounded-3xl p-5">
            {cardHead(
              'Notes',
              <Link to="/notes" className={linkClass}>
                All
              </Link>,
            )}
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                const body = noteDraft.trim()
                if (!body) return
                const title = body.split('\n')[0].slice(0, 48)
                void upsertNote({
                  id: crypto.randomUUID(),
                  title: title || 'Untitled',
                  body,
                  tags: ['Ideas'],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                })
                setNoteDraft('')
              }}
            >
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Scratch a thought for today…"
                rows={3}
                className={`${fieldClass} min-h-20 w-full py-3`}
              />
              <button
                type="submit"
                disabled={!noteDraft.trim()}
                className="min-h-11 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white disabled:opacity-40"
              >
                Save note
              </button>
            </form>
            {recentNotes.map((note) => (
              <Link key={note.id} to="/notes" className="block rounded-2xl bg-field px-4 py-3 ring-1 ring-line">
                <span className="block truncate text-sm text-fg">{note.title}</span>
                {note.body && note.body !== note.title ? (
                  <span className="mt-0.5 block line-clamp-2 text-[11px] text-muted">{note.body}</span>
                ) : null}
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
