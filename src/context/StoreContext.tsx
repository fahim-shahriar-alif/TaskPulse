import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { nextDue, todayKey } from '../lib/dates'
import { useTodayKey } from '../lib/now'
import { DEFAULT_HABITS } from '../lib/defaults'
import { getFirebase } from '../lib/firebase'
import { defaultSchedule, mergeClassSlots, normalizeSchedule } from '../lib/schedule'
import { normalizeClass } from '../lib/classes'
import { attendanceId, normalizeAttendance } from '../lib/attendance'
import { buildBackup, parseBackup, type BackupPayload } from '../lib/backup'
import { deleteClassNoteFile, normalizeClassNote } from '../lib/classNotes'
import { normalizeDeadline } from '../lib/deadlines'
import { lectureLogId, normalizeLectureLog } from '../lib/lectureLogs'
import type {
  Attendance,
  AttendanceStatus,
  ClassNote,
  DayDoc,
  Deadline,
  FocusSession,
  Habit,
  LectureLog,
  Note,
  Settings,
  Status,
  Task,
  UniClass,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'

type StoreContextValue = {
  ready: boolean
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  sessions: FocusSession[]
  classes: UniClass[]
  deadlines: Deadline[]
  classNotes: ClassNote[]
  attendance: Attendance[]
  lectureLogs: LectureLog[]
  days: DayDoc[]
  settings: Settings
  day: DayDoc
  upsertTask: (task: Task) => Promise<void>
  completeTask: (task: Task) => Promise<void>
  removeTask: (id: string) => Promise<void>
  upsertHabit: (habit: Habit) => Promise<void>
  removeHabit: (id: string) => Promise<void>
  upsertNote: (note: Note) => Promise<void>
  removeNote: (id: string) => Promise<void>
  addSession: (session: FocusSession) => Promise<void>
  upsertClass: (item: UniClass) => Promise<void>
  removeClass: (id: string) => Promise<void>
  upsertDeadline: (item: Deadline) => Promise<void>
  removeDeadline: (id: string) => Promise<void>
  upsertClassNote: (item: ClassNote) => Promise<void>
  removeClassNote: (item: ClassNote) => Promise<void>
  setAttendance: (classId: string, date: string, status: AttendanceStatus | null) => Promise<void>
  saveLectureLog: (classId: string, date: string, body: string) => Promise<void>
  saveDay: (patch: Partial<DayDoc>) => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>
  resetSchedule: () => Promise<void>
  exportBackup: () => BackupPayload
  importBackup: (raw: unknown) => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

function emptyDay(date: string): DayDoc {
  return { date, big3: ['', '', ''], schedule: defaultSchedule() }
}

export function normalizeTask(raw: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  const done = Boolean(raw.done || raw.status === 'completed')
  const status: Status = done ? 'completed' : raw.status === 'inprog' ? 'inprog' : 'todo'
  return {
    id: raw.id,
    title: raw.title,
    project: raw.project || 'Personal',
    priority: raw.priority || 'medium',
    dueDate: raw.dueDate || '',
    status,
    done,
    notes: raw.notes || '',
    tags: raw.tags || [],
    subtasks: raw.subtasks || [],
    recurrence: raw.recurrence || 'none',
    pomodoros: raw.pomodoros || 0,
    classId: raw.classId || '',
    createdAt: raw.createdAt || Date.now(),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const uid = user?.uid
  const date = useTodayKey()
  const [ready, setReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [classes, setClasses] = useState<UniClass[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [classNotes, setClassNotes] = useState<ClassNote[]>([])
  const [attendance, setAttendanceState] = useState<Attendance[]>([])
  const [lectureLogs, setLectureLogs] = useState<LectureLog[]>([])
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, theme })
  const [days, setDays] = useState<DayDoc[]>([])

  useEffect(() => {
    if (!uid) return
    const firebase = getFirebase()
    if (!firebase) return
    const { db } = firebase
    const unsubTasks = onSnapshot(
      collection(db, 'users', uid, 'tasks'),
      (snap) => {
        setTasks(snap.docs.map((item) => normalizeTask(item.data() as Task)))
      },
      () => setReady(true),
    )
    const unsubHabits = onSnapshot(
      collection(db, 'users', uid, 'habits'),
      async (snap) => {
        if (snap.empty && !sessionStorage.getItem(`tp-habits-${uid}`)) {
          sessionStorage.setItem(`tp-habits-${uid}`, '1')
          const seeded = DEFAULT_HABITS.map((name) => ({
            id: crypto.randomUUID(),
            name,
            completions: {},
            createdAt: Date.now(),
          }))
          try {
            await Promise.all(
              seeded.map((habit) => setDoc(doc(db, 'users', uid, 'habits', habit.id), habit)),
            )
          } catch {
            setHabits([])
          }
          return
        }
        sessionStorage.setItem(`tp-habits-${uid}`, '1')
        setHabits(snap.docs.map((item) => item.data() as Habit))
      },
      () => setReady(true),
    )
    const unsubNotes = onSnapshot(
      collection(db, 'users', uid, 'notes'),
      (snap) => {
        setNotes(snap.docs.map((item) => item.data() as Note))
      },
      () => setReady(true),
    )
    const unsubDays = onSnapshot(
      collection(db, 'users', uid, 'days'),
      (snap) => {
        setDays(snap.docs.map((item) => item.data() as DayDoc))
        setReady(true)
      },
      () => setReady(true),
    )
    const unsubSessions = onSnapshot(collection(db, 'users', uid, 'sessions'), (snap) => {
      setSessions(snap.docs.map((item) => item.data() as FocusSession))
    })
    const unsubClasses = onSnapshot(collection(db, 'users', uid, 'classes'), (snap) => {
      setClasses(snap.docs.map((item) => normalizeClass(item.data() as UniClass)))
    })
    const unsubDeadlines = onSnapshot(collection(db, 'users', uid, 'deadlines'), (snap) => {
      setDeadlines(snap.docs.map((item) => normalizeDeadline({ ...(item.data() as Deadline), id: item.id })))
    })
    const unsubClassNotes = onSnapshot(collection(db, 'users', uid, 'classNotes'), (snap) => {
      setClassNotes(snap.docs.map((item) => normalizeClassNote({ ...(item.data() as ClassNote), id: item.id })))
    })
    const unsubAttendance = onSnapshot(collection(db, 'users', uid, 'attendance'), (snap) => {
      setAttendanceState(snap.docs.map((item) => normalizeAttendance({ ...(item.data() as Attendance), id: item.id })))
    })
    const unsubLectureLogs = onSnapshot(collection(db, 'users', uid, 'lectureLogs'), (snap) => {
      setLectureLogs(snap.docs.map((item) => normalizeLectureLog({ ...(item.data() as LectureLog), id: item.id })))
    })
    const unsubSettings = onSnapshot(doc(db, 'users', uid, 'settings', 'app'), (snap) => {
      if (snap.exists()) {
        const incoming = snap.data() as Settings
        setSettings((prev) => ({
          ...DEFAULT_SETTINGS,
          ...incoming,
          theme: prev.theme,
        }))
      }
    })
    return () => {
      unsubTasks()
      unsubHabits()
      unsubNotes()
      unsubDays()
      unsubSessions()
      unsubClasses()
      unsubDeadlines()
      unsubClassNotes()
      unsubAttendance()
      unsubLectureLogs()
      unsubSettings()
    }
  }, [uid])

  const day = useMemo(() => {
    const found = days.find((item) => item.date === date)
    const base = emptyDay(date)
    const big3 = Array.isArray(found?.big3) ? found.big3 : base.big3
    const raw = found
      ? {
          ...base,
          ...found,
          big3: [big3[0] || '', big3[1] || '', big3[2] || ''] as [string, string, string],
          schedule: normalizeSchedule(found.schedule),
        }
      : base
    return {
      ...raw,
      schedule: mergeClassSlots(raw.schedule, classes, date),
    }
  }, [classes, date, days])

  const write = useCallback(
    async (path: string[], data: object) => {
      const firebase = getFirebase()
      if (!firebase || !uid) return
      await setDoc(doc(firebase.db, 'users', uid, ...path), data, { merge: true })
    },
    [uid],
  )

  const remove = useCallback(
    async (path: string[]) => {
      const firebase = getFirebase()
      if (!firebase || !uid) return
      await deleteDoc(doc(firebase.db, 'users', uid, ...path))
    },
    [uid],
  )

  const saveDay = useCallback(
    async (patch: Partial<DayDoc>) => {
      const next = { ...day, ...patch, date, schedule: normalizeSchedule(patch.schedule ?? day.schedule) }
      setDays((prev) => [...prev.filter((item) => item.date !== date), next])
      await write(['days', date], next)
    },
    [date, day, write],
  )

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      await write(['settings', 'app'], next)
    },
    [settings, write],
  )

  const upsertTask = useCallback((task: Task) => write(['tasks', task.id], normalizeTask(task)), [write])

  const completeTask = useCallback(
    async (task: Task) => {
      const done = !(task.done || task.status === 'completed')
      await upsertTask({
        ...task,
        done,
        status: done ? 'completed' : 'todo',
      })
      if (done && task.recurrence !== 'none') {
        await upsertTask(
          newTask({
            title: task.title,
            project: task.project,
            priority: task.priority,
            notes: task.notes,
            tags: task.tags,
            recurrence: task.recurrence,
            classId: task.classId,
            dueDate: nextDue(task.dueDate || todayKey(), task.recurrence),
          }),
        )
      }
    },
    [upsertTask],
  )

  const upsertClassNote = useCallback(
    async (item: ClassNote) => {
      const next = normalizeClassNote(item)
      setClassNotes((prev) => [next, ...prev.filter((entry) => entry.id !== next.id)])
      try {
        await write(['classNotes', next.id], next)
      } catch (err) {
        setClassNotes((prev) => prev.filter((entry) => entry.id !== next.id))
        throw err
      }
    },
    [write],
  )

  const removeClassNote = useCallback(
    async (item: ClassNote) => {
      if (uid) await deleteClassNoteFile(uid, item)
      await remove(['classNotes', item.id])
    },
    [remove, uid],
  )

  const setAttendance = useCallback(
    async (classId: string, date: string, status: AttendanceStatus | null) => {
      const id = attendanceId(classId, date)
      if (!status) {
        setAttendanceState((prev) => prev.filter((item) => item.id !== id))
        await remove(['attendance', id])
        return
      }
      const next = normalizeAttendance({ id, classId, date, status })
      setAttendanceState((prev) => [next, ...prev.filter((item) => item.id !== id)])
      await write(['attendance', id], next)
    },
    [remove, write],
  )

  const saveLectureLog = useCallback(
    async (classId: string, date: string, body: string) => {
      const id = lectureLogId(classId, date)
      const trimmed = body.trim()
      if (!trimmed) {
        setLectureLogs((prev) => prev.filter((item) => item.id !== id))
        await remove(['lectureLogs', id])
        return
      }
      const next = normalizeLectureLog({ id, classId, date, body: trimmed, updatedAt: Date.now() })
      setLectureLogs((prev) => [next, ...prev.filter((item) => item.id !== id)])
      await write(['lectureLogs', id], next)
    },
    [remove, write],
  )

  const removeClass = useCallback(
    async (id: string) => {
      const relatedNotes = classNotes.filter((item) => item.classId === id)
      const relatedExams = deadlines.filter((item) => item.classId === id)
      const relatedTasks = tasks.filter((item) => item.classId === id)
      const relatedAttendance = attendance.filter((item) => item.classId === id)
      const relatedLogs = lectureLogs.filter((item) => item.classId === id)
      await Promise.all([
        ...relatedNotes.map((item) => removeClassNote(item)),
        ...relatedExams.map((item) => remove(['deadlines', item.id])),
        ...relatedTasks.map((item) => upsertTask({ ...item, classId: '' })),
        ...relatedAttendance.map((item) => remove(['attendance', item.id])),
        ...relatedLogs.map((item) => remove(['lectureLogs', item.id])),
      ])
      await remove(['classes', id])
    },
    [attendance, classNotes, deadlines, lectureLogs, remove, removeClassNote, tasks, upsertTask],
  )

  const exportBackup = useCallback(
    () =>
      buildBackup({
        tasks,
        habits,
        notes,
        sessions,
        classes,
        deadlines,
        classNotes,
        attendance,
        lectureLogs,
        days,
        settings: { ...settings, lockHash: '', lockSalt: '' },
      }),
    [attendance, classNotes, classes, days, deadlines, habits, lectureLogs, notes, sessions, settings, tasks],
  )

  const importBackup = useCallback(
    async (raw: unknown) => {
      const payload = parseBackup(raw)
      const jobs: Promise<void>[] = [
        ...payload.tasks.filter((item) => item.id && item.title).map((item) => write(['tasks', item.id], normalizeTask(item))),
        ...payload.habits.filter((item) => item.id).map((item) => write(['habits', item.id], item)),
        ...payload.notes.filter((item) => item.id).map((item) => write(['notes', item.id], item)),
        ...payload.sessions.filter((item) => item.id).map((item) => write(['sessions', item.id], item)),
        ...payload.classes.filter((item) => item.id).map((item) => write(['classes', item.id], normalizeClass(item))),
        ...payload.deadlines
          .filter((item) => item.id)
          .map((item) => write(['deadlines', item.id], normalizeDeadline({ ...item, id: item.id }))),
        ...payload.classNotes
          .filter((item) => item.id)
          .map((item) => write(['classNotes', item.id], normalizeClassNote({ ...item, id: item.id }))),
        ...payload.attendance
          .filter((item) => item.id)
          .map((item) => write(['attendance', item.id], normalizeAttendance({ ...item, id: item.id }))),
        ...payload.lectureLogs
          .filter((item) => item.id)
          .map((item) => write(['lectureLogs', item.id], normalizeLectureLog({ ...item, id: item.id }))),
        ...payload.days.filter((item) => item.date).map((item) => write(['days', item.date], item)),
        write(['settings', 'app'], {
          ...payload.settings,
          theme: settings.theme,
          lockHash: settings.lockHash,
          lockSalt: settings.lockSalt,
        }),
      ]
      await Promise.all(jobs)
    },
    [settings.lockHash, settings.lockSalt, settings.theme, write],
  )

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      tasks,
      habits,
      notes,
      sessions,
      classes,
      deadlines,
      classNotes,
      attendance,
      lectureLogs,
      days,
      settings,
      day,
      upsertTask,
      completeTask,
      removeTask: (id) => remove(['tasks', id]),
      upsertHabit: (habit) => write(['habits', habit.id], habit),
      removeHabit: (id) => remove(['habits', id]),
      upsertNote: (note) => write(['notes', note.id], note),
      removeNote: (id) => remove(['notes', id]),
      addSession: (session) => write(['sessions', session.id], session),
      upsertClass: (item) => write(['classes', item.id], normalizeClass(item)),
      removeClass,
      upsertDeadline: (item) => write(['deadlines', item.id], normalizeDeadline(item)),
      removeDeadline: (id) => remove(['deadlines', id]),
      upsertClassNote,
      removeClassNote,
      setAttendance,
      saveLectureLog,
      saveDay,
      saveSettings,
      resetSchedule: () => saveDay({ schedule: day.schedule.filter((slot) => slot.classId) }),
      exportBackup,
      importBackup,
    }),
    [
      attendance,
      classNotes,
      completeTask,
      classes,
      day,
      days,
      deadlines,
      exportBackup,
      habits,
      importBackup,
      lectureLogs,
      notes,
      ready,
      remove,
      removeClass,
      removeClassNote,
      saveDay,
      saveLectureLog,
      saveSettings,
      sessions,
      setAttendance,
      settings,
      tasks,
      upsertClassNote,
      upsertTask,
      write,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export function newTask(partial: Partial<Task> = {}): Task {
  return normalizeTask({
    id: crypto.randomUUID(),
    title: '',
    project: 'Personal',
    priority: 'medium',
    dueDate: todayKey(),
    status: 'todo',
    done: false,
    notes: '',
    tags: [],
    subtasks: [],
    recurrence: 'none',
    pomodoros: 0,
    classId: '',
    createdAt: Date.now(),
    ...partial,
  })
}

export function toggleHabitToday(habit: Habit): Habit {
  const key = todayKey()
  return {
    ...habit,
    completions: { ...habit.completions, [key]: !habit.completions[key] },
  }
}
