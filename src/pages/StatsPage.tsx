import { useMemo } from 'react'
import { useStore } from '../context/StoreContext'
import { addDays, habitStreak, startOfWeek, todayKey } from '../lib/dates'
import { eyebrowClass, titleClass } from '../lib/ui'

export function StatsPage() {
  const { tasks, habits, sessions } = useStore()
  const today = todayKey()
  const weekStart = startOfWeek()
  const completedWeek = tasks.filter((task) => task.done && task.dueDate >= weekStart).length
  const openToday = tasks.filter((task) => !task.done && task.dueDate === today).length
  const focusWeek = sessions
    .filter((item) => item.date >= weekStart)
    .reduce((sum, item) => sum + item.minutes, 0)
  const bestStreak = Math.max(0, ...habits.map((habit) => habitStreak(habit.completions)))
  const days = Array.from({ length: 14 }, (_, index) => addDays(today, index - 13))
  const doneByDay = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach((task) => {
      if (!task.done || !task.dueDate) return
      map.set(task.dueDate, (map.get(task.dueDate) || 0) + 1)
    })
    return map
  }, [tasks])

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <p className={eyebrowClass}>Pro</p>
        <h1 className={titleClass}>Productivity</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Open today', String(openToday)],
          ['Done this week', String(completedWeek)],
          ['Focus minutes', String(focusWeek)],
          ['Best streak', String(bestStreak)],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-3xl p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-mono mt-2 text-3xl text-fg">{value}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-fg">Last 14 days</h2>
        <div className="mt-4 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-2">
          {days.map((day) => {
            const count = doneByDay.get(day) || 0
            const opacity = count === 0 ? 0.15 : Math.min(1, 0.25 + count * 0.2)
            return (
              <div key={day} className="text-center">
                <div
                  className="mx-auto h-10 w-full rounded-lg bg-indigo-500"
                  style={{ opacity }}
                  title={`${day}: ${count}`}
                />
                <p className="font-mono mt-1 text-[9px] text-faint">{day.slice(-2)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
