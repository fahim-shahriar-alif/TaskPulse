import { parseKey, todayKey } from './dates'
import type { Deadline, DeadlineKind, UniClass } from '../types'
import { DEADLINE_KINDS } from '../types'

export function normalizeDeadline(raw: Partial<Deadline> & Pick<Deadline, 'id'>): Deadline {
  const kind: DeadlineKind = DEADLINE_KINDS.some((item) => item.id === raw.kind) ? (raw.kind as DeadlineKind) : 'other'
  return {
    id: raw.id,
    title: raw.title?.trim() || '',
    date: raw.date || todayKey(),
    kind,
    classId: typeof raw.classId === 'string' ? raw.classId : '',
    createdAt: raw.createdAt || Date.now(),
  }
}

export function emptyDeadline(classId = ''): Deadline {
  return {
    id: crypto.randomUUID(),
    title: '',
    date: todayKey(),
    kind: 'exam',
    classId,
    createdAt: Date.now(),
  }
}

export function linkedClass(classes: UniClass[], classId: string) {
  return classes.find((item) => item.id === classId)
}

export function deadlineHeadline(item: Deadline, classes: UniClass[]) {
  return linkedClass(classes, item.classId)?.name || item.title.trim() || 'Untitled'
}

export function deadlineDetail(item: Deadline, classes: UniClass[]) {
  const kind = deadlineKindLabel(item.kind)
  const extra = item.title.trim()
  if (linkedClass(classes, item.classId) && extra) return `${kind} · ${extra}`
  return kind
}

export function examsForClass(items: Deadline[], classId: string, today = todayKey()) {
  return items
    .filter((item) => item.classId === classId && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
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
