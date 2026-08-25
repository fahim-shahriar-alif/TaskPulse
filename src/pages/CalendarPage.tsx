import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskRow } from '../components/TaskRow'
import { useStore } from '../context/StoreContext'
import { classMeetsOn, classesOnDay, formatClassTime } from '../lib/classes'
import { deadlineDetail, deadlineHeadline } from '../lib/deadlines'
import { monthGrid, parseKey, todayKey } from '../lib/dates'
import { eyebrowClass, titleClass } from '../lib/ui'

type Marks = { tasks: number; classes: number; exams: number }

const emptyMarks = (): Marks => ({ tasks: 0, classes: 0, exams: 0 })

function DayDots({ marks, on }: { marks: Marks; on: boolean }) {
  const dots = [
    marks.tasks > 0 ? (on ? 'bg-white' : 'bg-indigo-400') : null,
    marks.classes > 0 ? (on ? 'bg-cyan-100' : 'bg-cyan-400') : null,
    marks.exams > 0 ? (on ? 'bg-amber-200' : 'bg-amber-400') : null,
  ].filter(Boolean) as string[]
  if (!dots.length) return null
  return (
    <span className="mt-2 flex gap-0.5">
      {dots.map((tone) => (
        <span key={tone} className={`h-1.5 w-1.5 rounded-full ${tone}`} />
      ))}
    </span>
  )
}

export function CalendarPage() {
  const { tasks, classes, deadlines } = useStore()
  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState(todayKey())
  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor])
  const today = todayKey()

  const marks = useMemo(() => {
    const map = new Map<string, Marks>()
    function bump(key: string, field: keyof Marks) {
      if (!key) return
      const current = map.get(key) ?? emptyMarks()
      current[field] += 1
      map.set(key, current)
    }
    for (const task of tasks) bump(task.dueDate, 'tasks')
    for (const item of deadlines) bump(item.date, 'exams')
    for (const key of days) {
      for (const item of classes) {
        if (classMeetsOn(item, key)) bump(key, 'classes')
      }
    }
    return map
  }, [classes, days, deadlines, tasks])

  const selectedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.dueDate === selected)
        .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt),
    [selected, tasks],
  )
  const selectedClasses = useMemo(() => classesOnDay(classes, selected), [classes, selected])
  const selectedExams = useMemo(
    () =>
      deadlines
        .filter((item) => item.date === selected)
        .sort((a, b) => deadlineHeadline(a, classes).localeCompare(deadlineHeadline(b, classes))),
    [classes, deadlines, selected],
  )
  const empty = selectedTasks.length === 0 && selectedClasses.length === 0 && selectedExams.length === 0

  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
  const selectedLabel = parseKey(selected).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
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
            onClick={() => {
              setCursor({ year: now.getFullYear(), month: now.getMonth() })
              setSelected(today)
            }}
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
          const dayMarks = marks.get(key) ?? emptyMarks()
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={[
                'min-h-16 rounded-2xl p-2 text-left text-sm transition',
                selected === key ? 'bg-indigo-500 text-white shadow-md shadow-sky-500/25' : 'hover:bg-field',
                !inMonth && selected !== key ? 'text-faint' : selected === key ? '' : 'text-fg',
                key === today && selected !== key ? 'ring-2 ring-indigo-400/60' : '',
              ].join(' ')}
            >
              <span className="font-mono text-xs">{key.slice(-2)}</span>
              <DayDots marks={dayMarks} on={selected === key} />
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-3 px-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> Tasks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Classes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Exams
        </span>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-fg">{selectedLabel}</h2>

        {selectedClasses.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-cyan-500">Classes</h3>
            {selectedClasses.map((item) => (
              <Link
                key={item.id}
                to="/classes"
                className="glass flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4"
              >
                <span>
                  <span className="block text-sm text-fg">{item.name}</span>
                  {item.location ? <span className="text-[11px] text-faint">{item.location}</span> : null}
                </span>
                <span className="font-mono shrink-0 text-xs text-indigo-400">{formatClassTime(item)}</span>
              </Link>
            ))}
          </section>
        )}

        {selectedExams.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-amber-500">Exams & deadlines</h3>
            {selectedExams.map((item) => (
              <Link
                key={item.id}
                to="/deadlines"
                className="glass flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <span>
                  <span className="block text-sm text-fg">{deadlineHeadline(item, classes)}</span>
                  <span className="text-[11px] text-faint">{deadlineDetail(item, classes)}</span>
                  {item.syllabus ? (
                    <span className="mt-1 block line-clamp-2 text-[11px] text-muted">{item.syllabus}</span>
                  ) : null}
                </span>
              </Link>
            ))}
          </section>
        )}

        {selectedTasks.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-indigo-400">Tasks</h3>
            {selectedTasks.map((task) => (
              <TaskRow key={task.id} task={task} className="glass min-h-12 rounded-2xl" />
            ))}
          </section>
        )}

        {empty && <p className="text-sm text-muted">Nothing on this day.</p>}
      </div>
    </div>
  )
}
