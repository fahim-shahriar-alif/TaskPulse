import { useMemo, useState } from 'react'
import { CompletionRing } from '../components/CompletionRing'
import { newTask, toggleHabitToday, useStore } from '../context/StoreContext'
import { formatDayLabel, habitStreak, todayKey } from '../lib/dates'

export function MyDayPage() {
  const { tasks, habits, day, upsertTask, upsertHabit, saveDay } = useStore()
  const [draft, setDraft] = useState('')
  const today = todayKey()

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === today),
    [tasks, today],
  )
  const doneCount = todaysTasks.filter((task) => task.done || task.status === 'completed').length
  const pct = todaysTasks.length ? (doneCount / todaysTasks.length) * 100 : 0

  function addTask() {
    const title = draft.trim()
    if (!title) return
    void upsertTask(newTask({ title, dueDate: today }))
    setDraft('')
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-indigo-300/80 uppercase">My Day</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">{formatDayLabel()}</h1>
        </div>
        <div className="glass rounded-3xl p-5">
          <CompletionRing
            value={pct}
            label={todaysTasks.length ? `${doneCount} of ${todaysTasks.length} due today` : 'No tasks due today'}
          />
        </div>
        <form
          className="glass rounded-3xl p-2"
          onSubmit={(event) => {
            event.preventDefault()
            addTask()
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Quick add a task and press Enter"
            className="min-h-12 w-full rounded-2xl bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </form>
        <div className="space-y-2">
          {todaysTasks.map((task) => (
            <label key={task.id} className="glass flex min-h-14 items-center gap-3 rounded-2xl px-4">
              <input
                type="checkbox"
                checked={task.done || task.status === 'completed'}
                onChange={() => {
                  const done = !(task.done || task.status === 'completed')
                  void upsertTask({
                    ...task,
                    done,
                    status: done ? 'completed' : 'todo',
                  })
                }}
                className="h-5 w-5 accent-indigo-400"
              />
              <span className={task.done || task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-100'}>
                {task.title}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-white">Big 3 non-negotiables</h2>
          <p className="mt-1 text-xs text-slate-500">Highest-impact goals for today.</p>
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
                className="min-h-11 w-full rounded-2xl bg-slate-950/50 px-4 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-slate-500"
              />
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-white">Habit quick-check</h2>
          <div className="mt-4 space-y-2">
            {habits.map((habit) => {
              const done = Boolean(habit.completions[today])
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => void upsertHabit(toggleHabitToday(habit))}
                  className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-slate-950/40 px-4 text-left ring-1 ring-white/10"
                >
                  <span className="text-sm text-slate-200">{habit.name}</span>
                  <span className="font-mono text-xs text-slate-500">
                    {done ? 'Done' : `${habitStreak(habit.completions)} day streak`}
                  </span>
                </button>
              )
            })}
            {habits.length === 0 && <p className="text-sm text-slate-500">Add habits in the Habits tab.</p>}
          </div>
        </div>
      </section>
    </div>
  )
}
