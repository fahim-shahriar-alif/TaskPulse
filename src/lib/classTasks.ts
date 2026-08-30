import type { Task, UniClass } from '../types'
import { sortTasks } from './taskDates'

export function tasksForClass(tasks: Task[], classId: string) {
  return sortTasks(tasks.filter((task) => task.classId === classId))
}

export function classNameForId(classes: UniClass[], classId?: string) {
  if (!classId) return ''
  return classes.find((item) => item.id === classId)?.name || ''
}
