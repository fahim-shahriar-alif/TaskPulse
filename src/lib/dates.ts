export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
