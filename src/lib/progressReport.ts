import { classesOnDay, formatClassTime } from './classes'
import { formatHourLabel, habitStreak, todayKey } from './dates'
import { statusLabel } from './status'
import type { DayDoc, Habit, Task, UniClass } from '../types'

export type ProgressReportInput = {
  name: string
  email: string
  tasks: Task[]
  habits: Habit[]
  classes: UniClass[]
  day: DayDoc
  logoUrl: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function isDone(task: Task) {
  return task.done || task.status === 'completed'
}

function table(headers: string[], rows: string[][]) {
  if (!rows.length) return `<p class="empty">None today.</p>`
  return `<table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table>`
}

function clip(rows: string[][], limit: number) {
  if (rows.length <= limit) return rows
  const extra = rows.length - limit
  const cols = Math.max(1, rows[0]?.length ?? 1)
  const rest = Array.from({ length: cols - 1 }, () => '')
  return [...rows.slice(0, limit), [`<span class="muted">+${extra} more</span>`, ...rest]]
}

export function buildProgressReportHtml(input: ProgressReportInput) {
  const today = input.day.date || todayKey()
  const [y, m, d] = today.split('-').map(Number)
  const dateLabel = new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const dayTasks = [...input.tasks]
    .filter((task) => task.dueDate === today)
    .sort((a, b) => Number(isDone(a)) - Number(isDone(b)) || a.createdAt - b.createdAt)
  const todayClasses = classesOnDay(input.classes, today)
  const schedule = [...(input.day.schedule || [])].sort((a, b) => a.from.localeCompare(b.from))
  const habits = [...(input.habits || [])].sort((a, b) => a.name.localeCompare(b.name))
  const asOf = new Date(y, (m || 1) - 1, d || 1)
  const habitsDone = habits.filter((habit) => habit.completions[today]).length
  const doneN = dayTasks.filter(isDone).length

  const taskRows = clip(
    dayTasks.map((task) => [
      isDone(task) ? '✓' : '○',
      escapeHtml(task.title),
      escapeHtml(statusLabel(isDone(task) ? 'completed' : task.status)),
      escapeHtml(task.project || '—'),
    ]),
    14,
  )
  const classRows = clip(
    todayClasses.map((item) => [
      escapeHtml(formatClassTime(item)),
      escapeHtml(item.name),
      escapeHtml(item.location || '—'),
    ]),
    10,
  )
  const scheduleRows = clip(
    schedule.map((slot) => [
      slot.done ? '✓' : '○',
      escapeHtml(`${formatHourLabel(slot.from)} – ${formatHourLabel(slot.to)}`),
      escapeHtml(slot.activity.trim() || 'Untitled'),
    ]),
    10,
  )
  const habitRows = clip(
    habits.map((habit) => [
      habit.completions[today] ? '✓' : '○',
      escapeHtml(habit.name),
      `${habitStreak(habit.completions, asOf)}d`,
    ]),
    10,
  )

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TaskyPulse · ${escapeHtml(dateLabel)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      color: #0f172a;
      font: 11px/1.35 "Segoe UI", "Helvetica Neue", sans-serif;
    }
    .sheet {
      height: 277mm;
      max-height: 277mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0ea5e9;
    }
    .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .brand img {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      object-fit: cover;
      background: #e0f2fe;
    }
    .brand h1 { font-size: 20px; margin: 0; letter-spacing: -0.02em; }
    .brand p { margin: 2px 0 0; color: #0369a1; font-size: 11px; }
    .who { text-align: right; }
    .who strong { display: block; font-size: 14px; }
    .who span { color: #64748b; font-size: 11px; }
    .grid {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 1.15fr 0.95fr;
      grid-template-rows: 1fr 1fr 1fr;
      gap: 10px;
    }
    .card {
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 10px 12px;
      overflow: hidden;
    }
    .tasks { grid-row: 1 / 4; }
    h2 {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0284c7;
      margin: 0 0 8px;
    }
    h2 small { color: #64748b; letter-spacing: 0; text-transform: none; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    th { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    td { font-size: 11px; }
    .empty { color: #94a3b8; margin: 8px 0 0; }
    .muted { color: #64748b; }
    .mark { width: 18px; color: #059669; font-weight: 700; text-align: center; }
    footer {
      color: #94a3b8;
      font-size: 9px;
      text-align: center;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header>
      <div class="brand">
        <img src="${escapeHtml(input.logoUrl)}" alt="TaskyPulse" />
        <div>
          <h1>TaskyPulse</h1>
          <p>Daily plan</p>
        </div>
      </div>
      <div class="who">
        <strong>${escapeHtml(input.name)}</strong>
        ${input.email ? `<span>${escapeHtml(input.email)}</span><br/>` : ''}
        <span>${escapeHtml(dateLabel)}</span>
      </div>
    </header>

    <div class="grid">
      <section class="card tasks">
        <h2>Today’s tasks <small>${doneN}/${dayTasks.length} done</small></h2>
        ${table(['', 'Task', 'Status', 'List'], taskRows)}
      </section>
      <section class="card">
        <h2>Classes <small>${todayClasses.length}</small></h2>
        ${table(['Time', 'Class', 'Room'], classRows)}
      </section>
      <section class="card">
        <h2>Time schedule <small>${schedule.filter((slot) => slot.done).length}/${schedule.length} done</small></h2>
        ${table(['', 'Time', 'Activity'], scheduleRows)}
      </section>
      <section class="card">
        <h2>Habits <small>${habitsDone}/${habits.length} done</small></h2>
        ${table(['', 'Habit', 'Streak'], habitRows)}
      </section>
    </div>
    <footer>TaskyPulse · one-page daily plan · ${escapeHtml(dateLabel)}</footer>
  </div>
</body>
</html>`
}

export function printProgressPdf(input: Omit<ProgressReportInput, 'logoUrl'>) {
  const logoUrl = `${window.location.origin}/logo.png`
  const html = buildProgressReportHtml({ ...input, logoUrl })
  const win = window.open('', 'taskypulse-report')
  if (!win) {
    window.alert('Allow popups to print your daily plan, then try again.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()

  let printed = false
  const go = () => {
    if (printed) return
    printed = true
    win.focus()
    win.print()
  }
  const logo = win.document.querySelector('img')
  if (logo && !logo.complete) {
    logo.addEventListener('load', go, { once: true })
    logo.addEventListener('error', go, { once: true })
    window.setTimeout(go, 1200)
  } else {
    window.setTimeout(go, 250)
  }
}
