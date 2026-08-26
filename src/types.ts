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
  from: string
  to: string
  activity: string
  done: boolean
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

export type RepeatRule = 'weekly' | 'biweekly' | 'once'
export type WeekDay = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri'

export type UniClass = {
  id: string
  name: string
  course: string
  location: string
  days: WeekDay[]
  from: string
  to: string
  repeat: RepeatRule
  startDate: string
  notes: string
  createdAt: number
}

export type DeadlineKind = 'exam' | 'assignment' | 'other'

export type Deadline = {
  id: string
  title: string
  date: string
  kind: DeadlineKind
  classId: string
  syllabus: string
  createdAt: number
}

export type Settings = {
  theme: ThemeName
  pomoMinutes: number
  breakMinutes: number
  notifyEnabled: boolean
  notifyClasses: boolean
  notifyDeadlines: boolean
  notifyTasks: boolean
  classLeadMins: number
  lockHash: string
  lockSalt: string
}

export const TASK_STATUSES: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To do' },
  { id: 'inprog', label: 'In progress' },
  { id: 'completed', label: 'Done' },
]
export const PROJECTS = ['Work', 'Study', 'Personal', 'Health'] as const
export const NOTE_TAGS = ['Ideas', 'Bookmarks', 'Exam', 'DevOps'] as const
export const TASK_TAGS = ['deep', 'quick', 'waiting', 'home'] as const
export const DEADLINE_KINDS: { id: DeadlineKind; label: string }[] = [
  { id: 'exam', label: 'Exam' },
  { id: 'assignment', label: 'Assignment' },
  { id: 'other', label: 'Deadline' },
]

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  pomoMinutes: 25,
  breakMinutes: 5,
  notifyEnabled: false,
  notifyClasses: true,
  notifyDeadlines: true,
  notifyTasks: true,
  classLeadMins: 15,
  lockHash: '',
  lockSalt: '',
}
