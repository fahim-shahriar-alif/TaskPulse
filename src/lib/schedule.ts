import type { ScheduleSlot, UniClass } from '../types'
import { classesOnDay, formatClassTime, timesOverlap } from './classes'
import { addHour } from './dates'

export function defaultSchedule(): ScheduleSlot[] {
  return []
}

function padTime(value: string) {
  const [h, m] = value.split(':')
  return `${String(Number(h) || 0).padStart(2, '0')}:${String(Number(m) || 0).padStart(2, '0')}`
}

export function newScheduleSlot(from = '09:00', to = '10:00'): ScheduleSlot {
  return {
    id: crypto.randomUUID(),
    from: padTime(from),
    to: padTime(to),
    activity: '',
    done: false,
  }
}

export function normalizeScheduleSlot(
  raw: Partial<ScheduleSlot> & { time?: string; id?: string },
): ScheduleSlot {
  const from = padTime(raw.from || raw.time || '09:00')
  return {
    id: raw.id || crypto.randomUUID(),
    from,
    to: padTime(raw.to || addHour(from)),
    activity: raw.activity || '',
    done: Boolean(raw.done),
    classId: raw.classId || undefined,
  }
}

export function normalizeSchedule(list: unknown): ScheduleSlot[] {
  if (!Array.isArray(list)) return []
  return list.map((item) => normalizeScheduleSlot(item as Partial<ScheduleSlot> & { time?: string }))
}

export function updateSlot(schedule: ScheduleSlot[], id: string, patch: Partial<ScheduleSlot>) {
  return schedule.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot))
}

export function nextRange(schedule: ScheduleSlot[]) {
  if (!schedule.length) return { from: '09:00', to: '10:00' }
  const last = [...schedule].sort((a, b) => a.from.localeCompare(b.from)).at(-1)!
  const from = last.to || last.from
  return { from, to: addHour(from) }
}

export function mergeClassSlots(schedule: ScheduleSlot[], classes: UniClass[], key: string): ScheduleSlot[] {
  const today = classesOnDay(classes, key)
  const existing = new Map(schedule.filter((slot) => slot.classId).map((slot) => [slot.classId, slot]))
  const personal = schedule.filter((slot) => !slot.classId)
  const fromClasses = today.map((item) => {
    const prev = existing.get(item.id)
    return {
      id: prev?.id || `class:${item.id}`,
      from: item.from,
      to: item.to,
      activity: item.name,
      done: Boolean(prev?.done),
      classId: item.id,
    }
  })
  return [...personal, ...fromClasses]
}

export function classConflictsForSlot(slot: ScheduleSlot, classes: UniClass[], key: string) {
  return classesOnDay(classes, key).filter(
    (item) => item.id !== slot.classId && timesOverlap(slot.from, slot.to, item.from, item.to),
  )
}

export function slotConflictsForSlot(slot: ScheduleSlot, schedule: ScheduleSlot[]) {
  return schedule.filter((item) => item.id !== slot.id && timesOverlap(slot.from, slot.to, item.from, item.to))
}

export function conflictNote(slot: ScheduleSlot, classes: UniClass[], schedule: ScheduleSlot[], key: string) {
  const hits = classConflictsForSlot(slot, classes, key)
  const others = slotConflictsForSlot(slot, schedule)
  if (!hits.length && !others.length) return ''
  const parts = [
    ...hits.map((item) => `${item.name} (${formatClassTime(item)})`),
    ...others.map((item) => item.activity.trim() || 'another block'),
  ]
  return `Overlaps ${parts.join(' · ')}`
}
