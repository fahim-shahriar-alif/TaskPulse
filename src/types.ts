export type Priority = 'high' | 'medium' | 'low'
export type Status = 'todo' | 'inprog' | 'completed'

export type Task = {
  id: string
  title: string
  project: string
  priority: Priority
  dueDate: string
  status: Status
  done: boolean
  notes: string
  createdAt: number
}

export type Habit = {
  id: string
  name: string
  completions: Record<string, boolean>
  createdAt: number
}

export type Note = {
  id: string
  title: string
  body: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export type ScheduleSlot = {
  id: string
  time: string
  activity: string
}

export type DayDoc = {
  date: string
  big3: [string, string, string]
  schedule: ScheduleSlot[]
}

export type BackupPayload = {
  version: 1
  exportedAt: string
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  days: DayDoc[]
}

export const PROJECTS = ['Work', 'Study', 'Personal', 'Health'] as const
export const NOTE_TAGS = ['Ideas', 'Bookmarks', 'Exam', 'DevOps'] as const
