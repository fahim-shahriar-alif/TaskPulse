import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaskDetail } from './TaskDetailModal'
import { useLock } from '../context/LockContext'
import { useStore } from '../context/StoreContext'
import { deadlineHeadline } from '../lib/deadlines'
import { fieldClass } from '../lib/ui'

export function CommandPalette() {
  const { tasks, notes, habits, classes, deadlines } = useStore()
  const { locked } = useLock()
  const { openTask } = useTaskDetail()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (locked) {
      setOpen(false)
      return
    }
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [locked])

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return []
    const taskHits = tasks
      .filter((item) => item.title.toLowerCase().includes(q))
      .slice(0, 6)
      .map((item) => ({ id: item.id, label: item.title, to: '/tasks', kind: 'Task' as const, taskId: item.id }))
    const noteHits = notes
      .filter((item) => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ id: item.id, label: item.title, to: '/notes', kind: 'Note' as const }))
    const habitHits = habits
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ id: item.id, label: item.name, to: '/habits', kind: 'Habit' as const }))
    const classHits = classes
      .filter((item) => item.name.toLowerCase().includes(q) || item.course.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ id: item.id, label: item.name, to: '/classes', kind: 'Class' as const }))
    const classNoteHits = classes
      .filter((item) => item.name.toLowerCase().includes(q) || item.course.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({
        id: `photos-${item.id}`,
        label: `${item.name} photos`,
        to: `/class-notes/${item.id}`,
        kind: 'Class notes' as const,
      }))
    const deadlineHits = deadlines
      .filter((item) => {
        const label = deadlineHeadline(item, classes).toLowerCase()
        return label.includes(q) || item.title.toLowerCase().includes(q) || item.syllabus.toLowerCase().includes(q)
      })
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        label: deadlineHeadline(item, classes),
        to: '/deadlines',
        kind: 'Exam' as const,
      }))
    return [...taskHits, ...noteHits, ...habitHits, ...classHits, ...classNoteHits, ...deadlineHits]
  }, [classes, deadlines, habits, notes, q, tasks])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="glass relative flex h-dvh w-full flex-col rounded-none p-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-fg">Search</p>
          <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-3 text-sm text-muted">
            Close
          </button>
        </div>
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks, notes, habits, classes, exams"
          className={fieldClass + ' min-h-12 w-full'}
        />
        <div className="mt-2 min-h-0 flex-1 overflow-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.kind === 'Task') openTask(item.taskId)
                else navigate(item.to)
                setOpen(false)
                setQuery('')
              }}
              className="flex min-h-11 w-full items-center justify-between rounded-2xl px-3 text-left hover:bg-field"
            >
              <span className="text-sm text-fg">{item.label}</span>
              <span className="font-mono text-[10px] text-faint">{item.kind}</span>
            </button>
          ))}
          {q && results.length === 0 && <p className="px-3 py-4 text-sm text-muted">No matches.</p>}
          {!q && <p className="px-3 py-4 text-sm text-muted">Type to search. Shortcut: ⌘K / Ctrl+K</p>}
        </div>
      </div>
    </div>
  )
}
