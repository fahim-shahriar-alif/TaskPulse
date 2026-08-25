import { addDays, habitStreak, startOfWeek, todayKey } from './dates'
import type { DayDoc, FocusSession, Habit, Note, Task } from '../types'

export type ProgressReportInput = {
  name: string
  email: string
  joined: string
  tasks: Task[]
  habits: Habit[]
  notes: Note[]
  sessions: FocusSession[]
  day: DayDoc
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatDate(key: string) {
  if (!key) return '—'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function counts(items: string[]) {
  const map = new Map<string, number>()
  for (const item of items) map.set(item || 'None', (map.get(item || 'None') || 0) + 1)
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

function isDone(task: Task) {
  return task.done || task.status === 'completed'
}

function table(headers: string[], rows: string[][]) {
  if (!rows.length) return `<p class="empty">None yet.</p>`
  return `<table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows
      .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
      .join('')}</tbody>
  </table>`
}

export function buildProgressReportHtml(input: ProgressReportInput) {
  const today = todayKey()
  const weekStart = startOfWeek()
  const generated = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const done = input.tasks.filter(isDone)
  const open = input.tasks.filter((task) => !isDone(task))
  const inprog = input.tasks.filter((task) => task.status === 'inprog' && !isDone(task))
  const overdue = open.filter((task) => task.dueDate && task.dueDate < today)
  const dueToday = open.filter((task) => task.dueDate === today)
  const weekDone = done.filter((task) => task.dueDate >= weekStart)
  const focusWeek = input.sessions
    .filter((item) => item.date >= weekStart)
    .reduce((sum, item) => sum + item.minutes, 0)
  const focusAll = input.sessions.reduce((sum, item) => sum + item.minutes, 0)
  const pomos = input.tasks.reduce((sum, task) => sum + (task.pomodoros || 0), 0)
  const bestStreak = Math.max(0, ...input.habits.map((habit) => habitStreak(habit.completions)))
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
  const doneByDay = last14.map((day) => done.filter((task) => task.dueDate === day).length)
  const big3 = (input.day.big3 || []).filter(Boolean)
  const scheduleFilled = (input.day.schedule || []).filter((slot) => slot.activity.trim())

  const stats = [
    ['Tasks', String(input.tasks.length)],
    ['Completed', String(done.length)],
    ['Open', String(open.length)],
    ['Overdue', String(overdue.length)],
    ['Due today', String(dueToday.length)],
    ['Done this week', String(weekDone.length)],
    ['Focus this week', `${focusWeek} min`],
    ['Focus all time', `${focusAll} min`],
    ['Focus sessions', String(input.sessions.length)],
    ['Pomodoros logged', String(pomos)],
    ['Habits', String(input.habits.length)],
    ['Best streak', `${bestStreak} days`],
    ['Notes', String(input.notes.length)],
  ]

  const projectRows = counts(input.tasks.map((task) => task.project)).map(([name, n]) => {
    const doneN = done.filter((task) => (task.project || 'None') === name).length
    return [escapeHtml(name), String(n), String(doneN), n ? `${Math.round((doneN / n) * 100)}%` : '0%']
  })

  const priorityRows = (['high', 'medium', 'low'] as const).map((priority) => {
    const all = input.tasks.filter((task) => task.priority === priority)
    const doneN = all.filter(isDone).length
    return [priority, String(all.length), String(doneN), String(all.length - doneN)]
  })

  const habitRows = [...input.habits]
    .sort((a, b) => habitStreak(b.completions) - habitStreak(a.completions))
    .map((habit) => {
      const checkins = Object.values(habit.completions).filter(Boolean).length
      const spark = last14.map((day) => (habit.completions[day] ? '●' : '○')).join(' ')
      return [
        escapeHtml(habit.name),
        `${habitStreak(habit.completions)} days`,
        String(checkins),
        habit.completions[today] ? 'Done' : 'Open',
        `<span class="spark">${spark}</span>`,
      ]
    })

  const taskRow = (task: Task) => [
    escapeHtml(task.title),
    escapeHtml(task.project || '—'),
    escapeHtml(task.priority),
    escapeHtml(task.dueDate ? formatDate(task.dueDate) : '—'),
    escapeHtml(task.status),
  ]

  const openRows = [...open]
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .map(taskRow)
  const doneRows = [...done]
    .sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))
    .map(taskRow)
  const inprogRows = inprog.map(taskRow)

  const sessionRows = [...input.sessions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 40)
    .map((session) => [escapeHtml(formatDate(session.date)), `${session.minutes} min`])

  const noteRows = [...input.notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((note) => [
      escapeHtml(note.title || 'Untitled'),
      escapeHtml(note.tags?.join(', ') || '—'),
      escapeHtml(new Date(note.updatedAt).toLocaleDateString()),
    ])

  const activityBars = last14
    .map((day, i) => {
      const n = doneByDay[i]
      const h = n === 0 ? 4 : Math.min(48, 8 + n * 10)
      return `<div class="bar"><span style="height:${h}px"></span><small>${escapeHtml(day.slice(-2))}</small></div>`
    })
    .join('')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TaskPulse progress ${today}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1e293b;
      font: 12px/1.45 "Plus Jakarta Sans", "Segoe UI", sans-serif;
    }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 {
      font-size: 13px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #4f46e5;
      margin: 22px 0 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .meta { color: #64748b; font-size: 11px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
    .kpi span { display: block; color: #64748b; font-size: 10px; }
    .kpi strong { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eef2f7; vertical-align: top; }
    th { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
    .empty { color: #94a3b8; }
    .bars { display: flex; align-items: flex-end; gap: 6px; height: 72px; margin-top: 8px; }
    .bar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px; }
    .bar span { width: 100%; background: #6366f1; border-radius: 4px 4px 0 0; display: block; }
    .bar small { color: #94a3b8; font-size: 9px; }
    ul { margin: 0; padding-left: 18px; }
    .spark { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: 1px; color: #4f46e5; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>TaskPulse progress report</h1>
  <p class="meta">${escapeHtml(input.name)} · ${escapeHtml(input.email)} · Joined ${escapeHtml(input.joined)}</p>
  <p class="meta">Generated ${escapeHtml(generated)}</p>
  <div class="kpis">
    ${stats
      .map(
        ([label, value]) =>
          `<div class="kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`,
      )
      .join('')}
  </div>

  <h2>Last 14 days · completed tasks</h2>
  <div class="bars">${activityBars}</div>

  ${
    big3.length
      ? `<h2>Today’s Big 3</h2><ul>${big3.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : ''
  }
  ${
    scheduleFilled.length
      ? `<h2>Today’s schedule</h2>${table(
          ['Time', 'Activity'],
          scheduleFilled.map((slot) => [escapeHtml(slot.time), escapeHtml(slot.activity)]),
        )}`
      : ''
  }

  <h2>Projects</h2>
  ${table(['Project', 'Tasks', 'Completed', 'Rate'], projectRows)}

  <h2>Priority</h2>
  ${table(['Priority', 'Total', 'Completed', 'Open'], priorityRows)}

  <h2>Habits</h2>
  ${table(['Habit', 'Streak', 'Check-ins', 'Today', 'Last 14 days'], habitRows)}

  <h2>In progress</h2>
  ${table(['Task', 'Project', 'Priority', 'Due', 'Status'], inprogRows)}

  <h2>Open tasks</h2>
  ${table(['Task', 'Project', 'Priority', 'Due', 'Status'], openRows)}

  <h2>Completed tasks</h2>
  ${table(['Task', 'Project', 'Priority', 'Due', 'Status'], doneRows)}

  <h2>Focus sessions</h2>
  ${
    input.sessions.length > 40
      ? `<p class="meta">Showing the 40 most recent of ${input.sessions.length} sessions.</p>`
      : ''
  }
  ${table(['Date', 'Duration'], sessionRows)}

  <h2>Notes</h2>
  ${table(['Title', 'Tags', 'Updated'], noteRows)}
</body>
</html>`
}

export function printProgressPdf(input: ProgressReportInput) {
  const html = buildProgressReportHtml(input)
  const win = window.open('', 'taskpulse-report')
  if (!win) {
    window.alert('Allow popups to print your progress report, then try again.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  window.setTimeout(() => {
    win.focus()
    win.print()
  }, 250)
}
