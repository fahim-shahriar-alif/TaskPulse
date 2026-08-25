import { parseKey, todayKey } from './dates'
import type { Deadline, DeadlineKind } from '../types'
import { DEADLINE_KINDS } from '../types'

export function normalizeDeadline(raw: Partial<Deadline> & Pick<Deadline, 'id'>): Deadline {
  const kind: DeadlineKind = DEADLINE_KINDS.some((item) => item.id === raw.kind) ? (raw.kind as DeadlineKind) : 'other'
  return {
    id: raw.id,
    title: raw.title?.trim() || 'Untitled',
    date: raw.date || todayKey(),
    kind,
    createdAt: raw.createdAt || Date.now(),
  }
}

export function emptyDeadline(): Deadline {
  return {
    id: crypto.randomUUID(),
    title: '',
    date: todayKey(),
    kind: 'exam',
    createdAt: Date.now(),
  }
}

export function daysUntil(date: string, today = todayKey()) {
  return Math.round((parseKey(date).getTime() - parseKey(today).getTime()) / 86400000)
}

export function formatDaysLeft(date: string, today = todayKey()) {
  const n = daysUntil(date, today)
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  if (n === -1) return 'Yesterday'
  if (n < 0) return `${Math.abs(n)} days ago`
  return `${n} days`
}

export function deadlineKindLabel(kind: DeadlineKind) {
  return DEADLINE_KINDS.find((item) => item.id === kind)?.label ?? 'Deadline'
}

export function upcomingDeadlines(items: Deadline[], today = todayKey()) {
  return [...items]
    .filter((item) => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

export function pastDeadlines(items: Deadline[], today = todayKey()) {
  return [...items]
    .filter((item) => item.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
}
