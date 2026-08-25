import { useMemo, useState } from 'react'
import { TaskRow } from '../components/TaskRow'
import { useStore } from '../context/StoreContext'
import { monthGrid, todayKey } from '../lib/dates'
import { eyebrowClass, titleClass } from '../lib/ui'

export function CalendarPage() {
  const { tasks } = useStore()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState(todayKey())
  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor])
  const today = todayKey()
  const selectedTasks = tasks.filter((task) => task.dueDate === selected)
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach((task) => {
      if (!task.dueDate || task.done) return
      map.set(task.dueDate, (map.get(task.dueDate) || 0) + 1)
    })
    return map
  }, [tasks])

  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>Pro</p>
          <h1 className={titleClass}>{label}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-11 rounded-2xl px-4 text-sm text-muted ring-1 ring-line"
            onClick={() =>
              setCursor((item) =>
                item.month === 0 ? { year: item.year - 1, month: 11 } : { year: item.year, month: item.month - 1 },
              )
            }
          >
            Prev
          </button>
          <button
            type="button"
            className="min-h-11 rounded-2xl px-4 text-sm text-muted ring-1 ring-line"
            onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}
          >
            Today
          </button>
          <button
            type="button"
            className="min-h-11 rounded-2xl px-4 text-sm text-muted ring-1 ring-line"
            onClick={() =>
              setCursor((item) =>
                item.month === 11 ? { year: item.year + 1, month: 0 } : { year: item.year, month: item.month + 1 },
              )
            }
          >
            Next
          </button>
        </div>
      </div>
      <div className="glass grid grid-cols-7 gap-1 rounded-3xl p-3">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <p key={day} className="py-2 text-center font-mono text-[10px] text-faint">
            {day}
          </p>
        ))}
        {days.map((key) => {
          const inMonth = key.startsWith(`${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`)
          const count = counts.get(key) || 0
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={[
                'min-h-16 rounded-2xl p-2 text-left text-sm',
                selected === key ? 'bg-indigo-500 text-white' : 'hover:bg-field',
                !inMonth && selected !== key ? 'text-faint' : selected === key ? '' : 'text-fg',
                key === today && selected !== key ? 'ring-1 ring-indigo-400/50' : '',
              ].join(' ')}
            >
              <span className="font-mono text-xs">{key.slice(-2)}</span>
              {count > 0 && (
                <span className={`mt-2 block h-1.5 w-1.5 rounded-full ${selected === key ? 'bg-white' : 'bg-indigo-400'}`} />
              )}
            </button>
          )
        })}
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-fg">Due {selected}</h2>
        {selectedTasks.map((task) => (
          <TaskRow key={task.id} task={task} className="glass min-h-12 rounded-2xl" />
        ))}
        {selectedTasks.length === 0 && <p className="text-sm text-muted">Nothing due on this day.</p>}
      </div>
    </div>
  )
}
