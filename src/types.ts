export type Priority = 'high' | 'medium' | 'low'
export type Status = 'todo' | 'inprog' | 'completed'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'weekdays'
export type ThemeName = 'dark' | 'light'

export type Subtask = {
  id: string
  title: string
  done: boolean
}

export type Task = {
  id: string
  title: string
  project: string
  priority: Priority
  dueDate: string
  status: Status
  done: boolean
  notes: string
  tags: string[]
  subtasks: Subtask[]
  recurrence: Recurrence
  pomodoros: number
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

export type FocusSession = {
  id: string
  date: string
  minutes: number
  taskId?: string
  createdAt: number
}

export type Settings = {
  theme: ThemeName
  pomoMinutes: number
  breakMinutes: number
}

export const PROJECTS = ['Work', 'Study', 'Personal', 'Health'] as const
export const NOTE_TAGS = ['Ideas', 'Bookmarks', 'Exam', 'DevOps'] as const
export const TASK_TAGS = ['deep', 'quick', 'waiting', 'home'] as const

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  pomoMinutes: 25,
  breakMinutes: 5,
}
