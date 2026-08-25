export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(key: string, days: number) {
  const date = parseKey(key)
  date.setDate(date.getDate() + days)
  return todayKey(date)
}

export function nextDue(key: string, recurrence: 'daily' | 'weekly' | 'weekdays') {
  if (recurrence === 'daily') return addDays(key || todayKey(), 1)
  if (recurrence === 'weekly') return addDays(key || todayKey(), 7)
  let cursor = addDays(key || todayKey(), 1)
  while ([0, 6].includes(parseKey(cursor).getDay())) cursor = addDays(cursor, 1)
  return cursor
}

export function formatDayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export function formatHourLabel(time: string) {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function habitStreak(completions: Record<string, boolean>, from = new Date()) {
  let streak = 0
  const cursor = new Date(from)
  for (let i = 0; i < 400; i += 1) {
    const key = todayKey(cursor)
    if (completions[key]) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    if (i === 0) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    break
  }
  return streak
}

export function startOfWeek(date = new Date()) {
  const next = new Date(date)
  const day = next.getDay() || 7
  next.setDate(next.getDate() - day + 1)
  return todayKey(next)
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return todayKey(date)
  })
}
