import { formatHourLabel, parseKey, todayKey } from './dates'
import type { RepeatRule, UniClass, WeekDay } from '../types'

export const WEEKDAYS: { id: WeekDay; label: string; js: number }[] = [
  { id: 'sat', label: 'Sat', js: 6 },
  { id: 'sun', label: 'Sun', js: 0 },
  { id: 'mon', label: 'Mon', js: 1 },
  { id: 'tue', label: 'Tue', js: 2 },
  { id: 'wed', label: 'Wed', js: 3 },
  { id: 'thu', label: 'Thu', js: 4 },
  { id: 'fri', label: 'Fri', js: 5 },
]

export const REPEAT_OPTIONS: { id: RepeatRule; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'once', label: 'Once' },
]

export function weekdayFromKey(key: string): WeekDay {
  const js = parseKey(key).getDay()
  return WEEKDAYS.find((day) => day.js === js)?.id ?? 'sun'
}

export function formatDays(days: WeekDay[]) {
  if (!days.length) return 'No days'
  return days
    .map((id) => WEEKDAYS.find((day) => day.id === id)?.label ?? id)
    .join(' · ')
}

export function formatClassTime(item: UniClass) {
  return `${formatHourLabel(item.from)} – ${formatHourLabel(item.to)}`
}

export function normalizeClass(raw: Partial<UniClass> & Pick<UniClass, 'id' | 'name'>): UniClass {
  const days = Array.isArray(raw.days) ? raw.days.filter((day) => WEEKDAYS.some((item) => item.id === day)) : []
  return {
    id: raw.id,
    name: raw.name,
    course: raw.course || '',
    location: raw.location || '',
    days,
    from: raw.from || '09:00',
    to: raw.to || '10:00',
    repeat: raw.repeat || 'weekly',
    startDate: raw.startDate || todayKey(),
    notes: raw.notes || '',
    createdAt: raw.createdAt || Date.now(),
  }
}

export function emptyClass(): UniClass {
  return normalizeClass({
    id: crypto.randomUUID(),
    name: '',
    days: [],
    from: '09:00',
    to: '10:30',
    repeat: 'weekly',
    startDate: todayKey(),
    createdAt: Date.now(),
  })
}

export function classMeetsOn(item: UniClass, key: string) {
  const day = weekdayFromKey(key)
  if (!item.days.includes(day)) return false
  if (item.repeat === 'weekly') return true
  if (item.repeat === 'once') return item.startDate === key
  const start = parseKey(item.startDate || key)
  const date = parseKey(key)
  const diff = Math.floor((date.getTime() - start.getTime()) / 86400000)
  if (diff < 0) return false
  return Math.floor(diff / 7) % 2 === 0
}

export function classesOnDay(classes: UniClass[], key: string) {
  return classes
    .filter((item) => classMeetsOn(item, key))
    .sort((a, b) => a.from.localeCompare(b.from) || a.name.localeCompare(b.name))
}
