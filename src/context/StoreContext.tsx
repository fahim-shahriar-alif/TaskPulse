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
import { DEFAULT_HABITS, defaultSchedule } from '../lib/defaults'
import { getFirebase } from '../lib/firebase'
import type { DayDoc, FocusSession, Habit, Note, ScheduleSlot, Settings, Task } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'

type StoreContextValue = {
  ready: boolean
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  sessions: FocusSession[]
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
  saveDay: (patch: Partial<DayDoc>) => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>
  resetSchedule: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

function emptyDay(date: string): DayDoc {
  return { date, big3: ['', '', ''], schedule: defaultSchedule() }
}

export function normalizeTask(raw: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    id: raw.id,
    title: raw.title,
    project: raw.project || 'Personal',
    priority: raw.priority || 'medium',
    dueDate: raw.dueDate || '',
    status: raw.status || (raw.done ? 'completed' : 'todo'),
    done: Boolean(raw.done || raw.status === 'completed'),
    notes: raw.notes || '',
    tags: raw.tags || [],
    subtasks: raw.subtasks || [],
    recurrence: raw.recurrence || 'none',
    pomodoros: raw.pomodoros || 0,
    createdAt: raw.createdAt || Date.now(),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const uid = user?.uid
  const date = todayKey()
  const [ready, setReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [sessions, setSessions] = useState<FocusSession[]>([])
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
    const unsubSettings = onSnapshot(doc(db, 'users', uid, 'settings', 'app'), (snap) => {
      if (snap.exists()) {
        const next = { ...DEFAULT_SETTINGS, ...(snap.data() as Settings) }
        setSettings(next)
        if (next.theme) setTheme(next.theme)
      }
    })
    return () => {
      unsubTasks()
      unsubHabits()
      unsubNotes()
      unsubDays()
      unsubSessions()
      unsubSettings()
    }
  }, [setTheme, uid])

  const day = useMemo(() => {
    const found = days.find((item) => item.date === date)
    const base = emptyDay(date)
    if (!found) return base
    const big3 = Array.isArray(found.big3) ? found.big3 : base.big3
    return {
      ...base,
      ...found,
      big3: [big3[0] || '', big3[1] || '', big3[2] || ''] as [string, string, string],
      schedule: Array.isArray(found.schedule) && found.schedule.length ? found.schedule : base.schedule,
    }
  }, [date, days])

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
      const next = { ...day, ...patch, date }
      await write(['days', date], next)
    },
    [date, day, write],
  )

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      if (patch.theme) setTheme(patch.theme)
      await write(['settings', 'app'], next)
    },
    [setTheme, settings, write],
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
            dueDate: nextDue(task.dueDate || todayKey(), task.recurrence),
          }),
        )
      }
    },
    [upsertTask],
  )

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      tasks,
      habits,
      notes,
      sessions,
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
      saveDay,
      saveSettings,
      resetSchedule: () => saveDay({ schedule: defaultSchedule() }),
    }),
    [
      completeTask,
      day,
      habits,
      notes,
      ready,
      remove,
      saveDay,
      saveSettings,
      sessions,
      settings,
      tasks,
      uid,
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

export function updateSlot(schedule: ScheduleSlot[], id: string, activity: string) {
  return schedule.map((slot) => (slot.id === id ? { ...slot, activity } : slot))
}
