import { DEFAULT_SETTINGS } from '../types'
import type {
  Attendance,
  ClassNote,
  DayDoc,
  Deadline,
  FocusSession,
  Habit,
  Note,
  Settings,
  Task,
  UniClass,
} from '../types'

export const BACKUP_VERSION = 1

export type BackupPayload = {
  version: number
  exportedAt: string
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  sessions: FocusSession[]
  classes: UniClass[]
  deadlines: Deadline[]
  classNotes: ClassNote[]
  attendance: Attendance[]
  days: DayDoc[]
  settings: Settings
}

export type BackupExportInput = Omit<BackupPayload, 'version' | 'exportedAt'>

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function buildBackup(input: BackupExportInput): BackupPayload {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...input,
  }
}

export function parseBackup(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== 'object') throw new Error('That file is not a TaskyPulse backup.')
  const data = raw as Record<string, unknown>
  const looksLikeBackup =
    data.version === BACKUP_VERSION ||
    Array.isArray(data.tasks) ||
    Array.isArray(data.classes) ||
    Array.isArray(data.attendance)
  if (!looksLikeBackup) throw new Error('That file is not a TaskyPulse backup.')
  const settingsRaw = data.settings && typeof data.settings === 'object' ? (data.settings as Partial<Settings>) : {}
  return {
    version: typeof data.version === 'number' ? data.version : BACKUP_VERSION,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    tasks: asArray<Task>(data.tasks),
    habits: asArray<Habit>(data.habits),
    notes: asArray<Note>(data.notes),
    sessions: asArray<FocusSession>(data.sessions),
    classes: asArray<UniClass>(data.classes),
    deadlines: asArray<Deadline>(data.deadlines),
    classNotes: asArray<ClassNote>(data.classNotes),
    attendance: asArray<Attendance>(data.attendance),
    days: asArray<DayDoc>(data.days),
    settings: {
      ...DEFAULT_SETTINGS,
      ...settingsRaw,
    },
  }
}

export function backupFileName(date: string) {
  return `taskpulse_backup_${date}.json`
}
