import { useMemo, useState } from 'react'
import { AddTaskModal } from '../components/AddTaskModal'
import { CompletionRing } from '../components/CompletionRing'
import { toggleHabitToday, useStore } from '../context/StoreContext'
import { formatDayLabel, habitStreak, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'

export function MyDayPage() {
  const { tasks, habits, day, sessions, completeTask, upsertHabit, saveDay } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const today = todayKey()

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today || (!task.dueDate && !task.done)),
    [tasks, today],
  )
  const overdue = useMemo(
    () => tasks.filter((task) => task.dueDate && task.dueDate < today && !task.done),
    [tasks, today],
  )
  const dueToday = todaysTasks.filter((task) => task.dueDate === today)
  const doneCount = dueToday.filter((task) => task.done).length
  const pct = dueToday.length ? (doneCount / dueToday.length) * 100 : 0
  const focusToday = sessions.filter((item) => item.date === today).reduce((sum, item) => sum + item.minutes, 0)

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        <div>
          <p className={eyebrowClass}>My Day</p>
          <h1 className={titleClass}>{formatDayLabel()}</h1>
        </div>
        <div className="glass rounded-3xl p-5">
          <CompletionRing
            value={pct}
            label={
              dueToday.length
                ? `${doneCount} of ${dueToday.length} due today · ${focusToday}m focus`
                : `No dated tasks today · ${focusToday}m focus`
            }
          />
        </div>
        {overdue.length > 0 && (
          <div className="rounded-3xl bg-rose-500/10 p-4 ring-1 ring-rose-400/20">
            <p className="text-sm font-medium text-rose-500">{overdue.length} overdue</p>
            <div className="mt-2 space-y-2">
              {overdue.map((task) => (
                <label key={task.id} className="flex min-h-10 items-center gap-3 text-sm">
                  <input type="checkbox" checked={false} onChange={() => void completeTask(task)} className="accent-indigo-400" />
                  <span className="text-fg">{task.title}</span>
                </label>
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
        <AddTaskModal
          open={addOpen}
          initialDueDate={today}
          onClose={() => setAddOpen(false)}
        />
        <div className="space-y-2">
          {todaysTasks.map((task) => (
            <label key={task.id} className="glass flex min-h-14 items-center gap-3 rounded-2xl px-4">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => void completeTask(task)}
                className="h-5 w-5 accent-indigo-400"
              />
              <span className={task.done ? 'text-faint line-through' : 'text-fg'}>{task.title}</span>
            </label>
          ))}
        </div>
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
          <h2 className="text-sm font-semibold text-fg">Habit quick-check</h2>
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
      </section>
    </div>
  )
}
