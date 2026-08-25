import type { ScheduleSlot } from '../types'
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
