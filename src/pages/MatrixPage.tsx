import { TaskRow } from '../components/TaskRow'
import { useStore } from '../context/StoreContext'
import { todayKey } from '../lib/dates'
import { eyebrowClass, titleClass } from '../lib/ui'
import type { Task } from '../types'

function Quadrant({ title, hint, tasks }: { title: string; hint: string; tasks: Task[] }) {
  return (
    <section className="glass min-h-64 rounded-3xl p-4">
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      <p className="mt-1 text-xs text-faint">{hint}</p>
      <div className="mt-3 space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} showPriority={false} className="min-h-11 px-3" />
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted">Clear.</p>}
      </div>
    </section>
  )
}

export function MatrixPage() {
  const { tasks } = useStore()
  const today = todayKey()
  const open = tasks.filter((task) => !task.done)
  const urgent = (task: Task) => Boolean(task.dueDate && task.dueDate <= today)
  const important = (task: Task) => task.priority === 'high'

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className={eyebrowClass}>Pro</p>
        <h1 className={titleClass}>Eisenhower matrix</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Quadrant
          title="Do now"
          hint="Important and urgent"
          tasks={open.filter((task) => important(task) && urgent(task))}
        />
        <Quadrant
          title="Schedule"
          hint="Important, not urgent"
          tasks={open.filter((task) => important(task) && !urgent(task))}
        />
        <Quadrant
          title="Delegate / quick"
          hint="Urgent, not important"
          tasks={open.filter((task) => !important(task) && urgent(task))}
        />
        <Quadrant
          title="Later"
          hint="Neither"
          tasks={open.filter((task) => !important(task) && !urgent(task))}
        />
      </div>
    </div>
  )
}
