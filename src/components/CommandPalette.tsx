import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { fieldClass } from '../lib/ui'

export function CommandPalette() {
  const { tasks, notes, habits } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!q) return []
    const taskHits = tasks
      .filter((item) => item.title.toLowerCase().includes(q))
      .slice(0, 6)
      .map((item) => ({ id: item.id, label: item.title, to: '/tasks', kind: 'Task' }))
    const noteHits = notes
      .filter((item) => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ id: item.id, label: item.title, to: '/notes', kind: 'Note' }))
    const habitHits = habits
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((item) => ({ id: item.id, label: item.name, to: '/habits', kind: 'Habit' }))
    return [...taskHits, ...noteHits, ...habitHits]
  }, [habits, notes, q, tasks])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label="Close search" onClick={() => setOpen(false)} />
      <div className="glass relative w-full max-w-lg rounded-3xl p-3">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks, notes, habits"
          className={fieldClass + ' min-h-12 w-full'}
        />
        <div className="mt-2 max-h-72 overflow-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                navigate(item.to)
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
