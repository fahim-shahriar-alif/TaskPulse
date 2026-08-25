import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'

export function FocusPage() {
  const { settings, tasks, sessions, addSession, upsertTask, saveSettings } = useStore()
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [running, setRunning] = useState(false)
  const [taskId, setTaskId] = useState('')
  const duration = (mode === 'focus' ? settings.pomoMinutes : settings.breakMinutes) * 60
  const [left, setLeft] = useState(duration)

  useEffect(() => {
    setLeft(duration)
  }, [duration, mode])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id)
          setRunning(false)
          if (mode === 'focus') {
            const session = {
              id: crypto.randomUUID(),
              date: todayKey(),
              minutes: settings.pomoMinutes,
              taskId: taskId || undefined,
              createdAt: Date.now(),
            }
            void addSession(session)
            const task = tasks.find((item) => item.id === taskId)
            if (task) void upsertTask({ ...task, pomodoros: task.pomodoros + 1 })
            setMode('break')
          } else {
            setMode('focus')
          }
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [addSession, mode, running, settings.pomoMinutes, taskId, tasks, upsertTask])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const todayMinutes = useMemo(
    () => sessions.filter((item) => item.date === todayKey()).reduce((sum, item) => sum + item.minutes, 0),
    [sessions],
  )
  const openTasks = tasks.filter((task) => !task.done)

  return (
    <div className="mx-auto max-w-lg space-y-5 text-center">
      <div>
        <p className={eyebrowClass}>Focus</p>
        <h1 className={titleClass}>{mode === 'focus' ? 'Pomodoro' : 'Break'}</h1>
      </div>
      <div className="glass rounded-[2rem] px-6 py-10">
        <p className="font-mono text-6xl font-semibold tracking-tight text-fg sm:text-7xl">
          {mm}:{ss}
        </p>
        <p className="mt-3 text-sm text-muted">{todayMinutes} focused minutes today</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((value) => !value)}
            className="min-h-12 rounded-2xl bg-indigo-500 px-6 text-sm font-medium text-white"
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false)
              setLeft(duration)
            }}
            className="min-h-12 rounded-2xl px-6 text-sm text-muted ring-1 ring-line"
          >
            Reset
          </button>
        </div>
      </div>
      <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={fieldClass}>
        <option value="">Link a task (optional)</option>
        {openTasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
      <div className="glass grid grid-cols-2 gap-3 rounded-3xl p-4 text-left">
        <label className="text-sm text-muted">
          Focus minutes
          <input
            type="number"
            min={5}
            max={90}
            value={settings.pomoMinutes}
            onChange={(event) => void saveSettings({ pomoMinutes: Number(event.target.value) || 25 })}
            className={`${fieldClass} mt-2 w-full`}
          />
        </label>
        <label className="text-sm text-muted">
          Break minutes
          <input
            type="number"
            min={1}
            max={30}
            value={settings.breakMinutes}
            onChange={(event) => void saveSettings({ breakMinutes: Number(event.target.value) || 5 })}
            className={`${fieldClass} mt-2 w-full`}
          />
        </label>
      </div>
    </div>
  )
}
