import { Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TaskRow } from '../components/TaskRow'
import { useStore } from '../context/StoreContext'
import { todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'

export function FocusPage() {
  const { settings, tasks, sessions, addSession, upsertTask, saveSettings } = useStore()
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const [running, setRunning] = useState(false)
  const [full, setFull] = useState(false)
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

  useEffect(() => {
    if (!full) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setFull(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [full])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const todayMinutes = useMemo(
    () => sessions.filter((item) => item.date === todayKey()).reduce((sum, item) => sum + item.minutes, 0),
    [sessions],
  )
  const openTasks = tasks.filter((task) => !task.done)
  const linkedTask = tasks.find((task) => task.id === taskId)
  const label = mode === 'focus' ? 'Pomodoro' : 'Break'

  function Controls({ showFullToggle }: { showFullToggle: boolean }) {
    return (
      <div className="mt-6 flex flex-wrap justify-center gap-2">
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
        {showFullToggle && (
          <button
            type="button"
            onClick={() => setFull(true)}
            className="min-h-12 rounded-2xl px-6 text-sm text-fg ring-1 ring-line"
          >
            Fullscreen
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 text-center">
      <div>
        <p className={eyebrowClass}>Focus</p>
        <h1 className={titleClass}>{label}</h1>
      </div>
      <div className="glass rounded-[2rem] px-6 py-10">
        <p className="font-mono text-6xl font-semibold tracking-tight text-fg sm:text-7xl">
          {mm}:{ss}
        </p>
        <p className="mt-3 text-sm text-muted">{todayMinutes} focused minutes today</p>
        <Controls showFullToggle />
      </div>
      <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={fieldClass}>
        <option value="">Link a task (optional)</option>
        {openTasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </select>
      {linkedTask ? <TaskRow task={linkedTask} className="text-left" /> : null}
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

      {full && (
        <div className="bg-app fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-fg">
          <button
            type="button"
            onClick={() => setFull(false)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-2xl text-muted ring-1 ring-line"
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <p className={eyebrowClass}>{mode === 'focus' ? 'Focus' : 'Break'}</p>
          <p className="font-mono mt-4 text-[22vw] font-semibold leading-none tracking-tight text-fg sm:text-9xl">
            {mm}:{ss}
          </p>
          <p className="mt-4 text-sm text-muted">{label}</p>
          <Controls showFullToggle={false} />
          <p className="mt-8 flex items-center gap-2 text-xs text-faint">
            <Maximize2 className="h-3.5 w-3.5" />
            Esc to exit
          </p>
        </div>
      )}
    </div>
  )
}
