import { addDays, formatHourLabel, parseKey, todayKey } from './dates'
import { nowDate } from './clock'
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

export function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function timesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  const a0 = timeToMinutes(aFrom)
  const a1 = Math.max(a0 + 1, timeToMinutes(aTo))
  const b0 = timeToMinutes(bFrom)
  const b1 = Math.max(b0 + 1, timeToMinutes(bTo))
  return a0 < b1 && b0 < a1
}

export function classesOverlapOnCalendar(a: UniClass, b: UniClass, from = todayKey()) {
  if (a.id === b.id) return false
  if (!timesOverlap(a.from, a.to, b.from, b.to)) return false
  if (a.repeat === 'once' && classMeetsOn(b, a.startDate)) return true
  if (b.repeat === 'once' && classMeetsOn(a, b.startDate)) return true
  for (let i = 0; i < 16 * 7; i += 1) {
    const key = addDays(from, i)
    if (classMeetsOn(a, key) && classMeetsOn(b, key)) return true
  }
  return false
}

export function overlappingClasses(item: UniClass, list: UniClass[]) {
  return list.filter((other) => classesOverlapOnCalendar(item, other))
}

export function nowMinutes(date = nowDate()) {
  return date.getHours() * 60 + date.getMinutes()
}

export type ClassMoment = 'upcoming' | 'live' | 'done'

export function classMoment(item: UniClass, minutes: number): ClassMoment {
  const from = timeToMinutes(item.from)
  const to = Math.max(from + 1, timeToMinutes(item.to))
  if (minutes < from) return 'upcoming'
  if (minutes < to) return 'live'
  return 'done'
}

export function nextClassToday(classes: UniClass[], key: string, minutes: number) {
  return classesOnDay(classes, key).find((item) => classMoment(item, minutes) !== 'done') ?? null
}

function formatSpan(mins: number) {
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export function formatClassCountdown(item: UniClass, minutes: number) {
  const from = timeToMinutes(item.from)
  const to = Math.max(from + 1, timeToMinutes(item.to))
  const moment = classMoment(item, minutes)
  if (moment === 'live') {
    const left = to - minutes
    if (left <= 1) return 'ending now'
    return `ends in ${formatSpan(left)}`
  }
  const wait = from - minutes
  if (wait <= 0) return 'starting now'
  return `in ${formatSpan(wait)}`
}
