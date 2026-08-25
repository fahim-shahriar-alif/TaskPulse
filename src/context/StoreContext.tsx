import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { todayKey } from '../lib/dates'
import { DEFAULT_HABITS, defaultSchedule } from '../lib/defaults'
import { getFirebase } from '../lib/firebase'
import type { BackupPayload, DayDoc, Habit, Note, ScheduleSlot, Task } from '../types'
import { useAuth } from './AuthContext'

type StoreContextValue = {
  ready: boolean
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  day: DayDoc
  upsertTask: (task: Task) => Promise<void>
  removeTask: (id: string) => Promise<void>
  upsertHabit: (habit: Habit) => Promise<void>
  removeHabit: (id: string) => Promise<void>
  upsertNote: (note: Note) => Promise<void>
  removeNote: (id: string) => Promise<void>
  saveDay: (patch: Partial<DayDoc>) => Promise<void>
  resetSchedule: () => Promise<void>
  exportBackup: () => BackupPayload
  importBackup: (payload: BackupPayload) => Promise<void>
  resetAll: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

function emptyDay(date: string): DayDoc {
  return { date, big3: ['', '', ''], schedule: defaultSchedule() }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const uid = user?.uid
  const date = todayKey()
  const [ready, setReady] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [days, setDays] = useState<DayDoc[]>([])

  useEffect(() => {
    if (!uid) return
    const firebase = getFirebase()
    if (!firebase) return
    const { db } = firebase
    const unsubTasks = onSnapshot(collection(db, 'users', uid, 'tasks'), (snap) => {
      setTasks(snap.docs.map((item) => item.data() as Task))
    })
    const unsubHabits = onSnapshot(collection(db, 'users', uid, 'habits'), async (snap) => {
      if (snap.empty && !sessionStorage.getItem(`tp-habits-${uid}`)) {
        sessionStorage.setItem(`tp-habits-${uid}`, '1')
        const seeded = DEFAULT_HABITS.map((name) => ({
          id: crypto.randomUUID(),
          name,
          completions: {},
          createdAt: Date.now(),
        }))
        await Promise.all(
          seeded.map((habit) => setDoc(doc(db, 'users', uid, 'habits', habit.id), habit)),
        )
        return
      }
      sessionStorage.setItem(`tp-habits-${uid}`, '1')
      setHabits(snap.docs.map((item) => item.data() as Habit))
    })
    const unsubNotes = onSnapshot(collection(db, 'users', uid, 'notes'), (snap) => {
      setNotes(snap.docs.map((item) => item.data() as Note))
    })
    const unsubDays = onSnapshot(collection(db, 'users', uid, 'days'), (snap) => {
      setDays(snap.docs.map((item) => item.data() as DayDoc))
      setReady(true)
    })
    return () => {
      unsubTasks()
      unsubHabits()
      unsubNotes()
      unsubDays()
    }
  }, [uid])

  const day = useMemo(() => days.find((item) => item.date === date) ?? emptyDay(date), [date, days])

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

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      tasks,
      habits,
      notes,
      day,
      upsertTask: (task) => write(['tasks', task.id], task),
      removeTask: (id) => remove(['tasks', id]),
      upsertHabit: (habit) => write(['habits', habit.id], habit),
      removeHabit: (id) => remove(['habits', id]),
      upsertNote: (note) => write(['notes', note.id], note),
      removeNote: (id) => remove(['notes', id]),
      saveDay,
      resetSchedule: () => saveDay({ schedule: defaultSchedule() }),
      exportBackup: () => ({
        version: 1,
        exportedAt: new Date().toISOString(),
        tasks,
        habits,
        notes,
        days: days.length ? days : [day],
      }),
      importBackup: async (payload) => {
        const firebase = getFirebase()
        if (!firebase || !uid) return
        const { db } = firebase
        const batch = writeBatch(db)
        payload.tasks.forEach((task) => batch.set(doc(db, 'users', uid, 'tasks', task.id), task))
        payload.habits.forEach((habit) => batch.set(doc(db, 'users', uid, 'habits', habit.id), habit))
        payload.notes.forEach((note) => batch.set(doc(db, 'users', uid, 'notes', note.id), note))
        payload.days.forEach((item) => batch.set(doc(db, 'users', uid, 'days', item.date), item))
        await batch.commit()
      },
      resetAll: async () => {
        const firebase = getFirebase()
        if (!firebase || !uid) return
        const { db } = firebase
        const collections = ['tasks', 'habits', 'notes', 'days'] as const
        for (const name of collections) {
          const snap = await getDocs(collection(db, 'users', uid, name))
          const batch = writeBatch(db)
          snap.docs.forEach((item) => batch.delete(item.ref))
          await batch.commit()
        }
      },
    }),
    [day, days, habits, notes, ready, remove, saveDay, tasks, uid, write],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export function newTask(partial: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: '',
    project: 'Personal',
    priority: 'medium',
    dueDate: todayKey(),
    status: 'todo',
    done: false,
    notes: '',
    createdAt: Date.now(),
    ...partial,
  }
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
