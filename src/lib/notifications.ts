import { classMeetsOn, formatClassTime, nowMinutes, timeToMinutes } from './classes'
import { addDays, formatHourLabel, todayKey } from './dates'
import { deadlineKindLabel } from './deadlines'
import type { Deadline, Settings, Task, UniClass } from '../types'

export type Notice = {
  tag: string
  title: string
  body: string
  url: string
}

const SEEN_KEY = 'taskpulse-notices'

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported' as const
  return Notification.requestPermission()
}

function loadSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') as unknown
    return new Set(Array.isArray(raw) ? raw.filter((item) => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function saveSeen(tags: Set<string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...tags].slice(-100)))
}

export function wasNoticeShown(tag: string) {
  return loadSeen().has(tag)
}

export function markNoticeShown(tag: string) {
  const next = loadSeen()
  next.add(tag)
  saveSeen(next)
}

export async function showNotice(notice: Notice) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  const options: NotificationOptions = {
    body: notice.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: notice.tag,
    data: { url: notice.url },
    silent: false,
  }
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification) {
      await reg.showNotification(notice.title, options)
      return true
    }
  } catch {
    /* fall through to the page Notification API */
  }
  try {
    new Notification(notice.title, options)
    return true
  } catch {
    return false
  }
}

export function collectDueNotices(input: {
  uid: string
  now?: Date
  classes: UniClass[]
  deadlines: Deadline[]
  tasks: Task[]
  settings: Settings
}): Notice[] {
  const now = input.now ?? new Date()
  const today = todayKey(now)
  const minutes = nowMinutes(now)
  const prefix = input.uid
  const notices: Notice[] = []
  const lead = Math.max(1, input.settings.classLeadMins || 15)

  if (input.settings.notifyClasses) {
    for (const item of input.classes) {
      if (!classMeetsOn(item, today)) continue
      const start = timeToMinutes(item.from)
      const wait = start - minutes
      const room = item.location ? ` · ${item.location}` : ''
      if (wait > 0 && wait <= lead) {
        notices.push({
          tag: `${prefix}:class-soon:${item.id}:${today}`,
          title: `Class in ${wait} min`,
          body: `${item.name} · ${formatClassTime(item)}${room}`,
          url: '/classes',
        })
      }
      if (wait <= 0 && wait >= -1) {
        notices.push({
          tag: `${prefix}:class-now:${item.id}:${today}`,
          title: 'Class starting',
          body: `${item.name} · ${formatHourLabel(item.from)}${room}`,
          url: '/classes',
        })
      }
    }
  }

  if (input.settings.notifyDeadlines) {
    const tomorrow = addDays(today, 1)
    for (const item of input.deadlines) {
      const kind = deadlineKindLabel(item.kind)
      if (item.date === today) {
        notices.push({
          tag: `${prefix}:deadline-today:${item.id}:${today}`,
          title: `${kind} today`,
          body: item.title,
          url: '/deadlines',
        })
      }
      if (item.date === tomorrow) {
        notices.push({
          tag: `${prefix}:deadline-soon:${item.id}:${today}`,
          title: `${kind} tomorrow`,
          body: item.title,
          url: '/deadlines',
        })
      }
    }
  }

  if (input.settings.notifyTasks) {
    const overdue = input.tasks.filter((task) => !task.done && task.dueDate && task.dueDate < today)
    if (overdue.length) {
      notices.push({
        tag: `${prefix}:overdue:${today}`,
        title: `${overdue.length} overdue task${overdue.length === 1 ? '' : 's'}`,
        body: overdue
          .slice(0, 3)
          .map((task) => task.title)
          .join(' · '),
        url: '/',
      })
    }
  }

  return notices.filter((item) => !wasNoticeShown(item.tag))
}

export async function flushDueNotices(input: Parameters<typeof collectDueNotices>[0]) {
  const due = collectDueNotices(input)
  for (const notice of due) {
    const ok = await showNotice(notice)
    if (ok) markNoticeShown(notice.tag)
  }
  return due.length
}
