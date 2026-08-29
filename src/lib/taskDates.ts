import type { Task } from '../types'
import { addDays, formatDayLabel, parseKey } from './dates'

export type TaskDateGroup = {
  id: string
  dueDate: string | null
  label: string
  hint: string
  tone: 'overdue' | 'today' | 'plain'
  tasks: Task[]
}

export function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt)
}

function dayLabel(key: string, today: string) {
  if (key === today) return 'Today'
  if (key === addDays(today, 1)) return 'Tomorrow'
  return formatDayLabel(parseKey(key))
}

function dayHint(key: string, today: string) {
  if (key === today || key === addDays(today, 1)) return formatDayLabel(parseKey(key))
  return ''
}

export function buildTaskDateGroups(
  tasks: Task[],
  today: string,
  options: { fillDays?: number } = {},
): TaskDateGroup[] {
  const fillDays = options.fillDays ?? 0
  const plannerEnd = fillDays > 0 ? addDays(today, fillDays - 1) : ''
  const groups: TaskDateGroup[] = []

  const overdue = sortTasks(tasks.filter((task) => task.dueDate && task.dueDate < today && !task.done))
  if (overdue.length) {
    groups.push({
      id: 'overdue',
      dueDate: null,
      label: 'Overdue',
      hint: 'Move these onto today or a later day',
      tone: 'overdue',
      tasks: overdue,
    })
  }

  const upcoming = new Set(
    tasks.map((task) => task.dueDate).filter((key): key is string => Boolean(key && key >= today)),
  )
  const keys: string[] = []
  if (fillDays > 0) {
    for (let i = 0; i < fillDays; i += 1) keys.push(addDays(today, i))
    for (const key of [...upcoming].sort()) {
      if (key > plannerEnd) keys.push(key)
    }
  } else {
    keys.push(...[...upcoming].sort())
  }

  for (const key of keys) {
    const list = sortTasks(tasks.filter((task) => task.dueDate === key))
    if (!fillDays && !list.length) continue
    groups.push({
      id: key,
      dueDate: key,
      label: dayLabel(key, today),
      hint: dayHint(key, today),
      tone: key === today ? 'today' : 'plain',
      tasks: list,
    })
  }

  const undated = sortTasks(tasks.filter((task) => !task.dueDate))
  if (undated.length || fillDays > 0) {
    groups.push({
      id: 'none',
      dueDate: '',
      label: 'No date',
      hint: 'Parked until you pick a day',
      tone: 'plain',
      tasks: undated,
    })
  }

  const earlier = sortTasks(tasks.filter((task) => task.dueDate && task.dueDate < today && task.done))
  if (earlier.length) {
    groups.push({
      id: 'earlier',
      dueDate: null,
      label: 'Earlier',
      hint: 'Finished before today',
      tone: 'plain',
      tasks: earlier,
    })
  }

  return groups
}
