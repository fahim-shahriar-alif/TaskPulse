import { useState } from 'react'
import { Modal } from '../components/Modal'
import { toggleHabitToday, useStore } from '../context/StoreContext'
import { habitStreak, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'

export function HabitsPage() {
  const { habits, upsertHabit, removeHabit } = useStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const today = todayKey()

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>Consistency</p>
          <h1 className={titleClass}>Habit tracker</h1>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-11 rounded-2xl bg-indigo-500 px-4 text-sm font-medium text-white"
        >
          Add habit
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {habits.map((habit) => {
          const done = Boolean(habit.completions[today])
          return (
            <article key={habit.id} className="glass rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-fg">{habit.name}</h2>
                  <p className="font-mono mt-1 text-xs text-faint">{habitStreak(habit.completions)} day streak</p>
                </div>
                <button type="button" onClick={() => void removeHabit(habit.id)} className="text-xs text-rose-400">
                  Delete
                </button>
              </div>
              <button
                type="button"
                onClick={() => void upsertHabit(toggleHabitToday(habit))}
                className={`mt-5 min-h-12 w-full rounded-2xl text-sm font-medium ${
                  done
                    ? 'bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-400/30 dark:text-emerald-200'
                    : 'bg-field text-fg ring-1 ring-line'
                }`}
              >
                {done ? 'Done today' : 'Mark complete'}
              </button>
            </article>
          )
        })}
      </div>
      <Modal open={open} title="New habit" onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            const next = name.trim()
            if (!next) return
            void upsertHabit({
              id: crypto.randomUUID(),
              name: next,
              completions: {},
              createdAt: Date.now(),
            })
            setName('')
            setOpen(false)
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Habit name"
            className={`${fieldClass} w-full`}
          />
          <button type="submit" className="min-h-11 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white">
            Save habit
          </button>
        </form>
      </Modal>
    </div>
  )
}
