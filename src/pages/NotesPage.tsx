import { useMemo, useState } from 'react'
import { useStore } from '../context/StoreContext'
import { NOTE_TAGS } from '../types'

function looksLikeCode(body: string, tags: string[]) {
  return tags.includes('DevOps') || body.includes('```') || body.trim().startsWith('$') || body.includes('\n  ')
}

export function NotesPage() {
  const { notes, upsertNote, removeNote } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tag, setTag] = useState('Ideas')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(
    () => notes.filter((note) => (filter === 'all' ? true : note.tags.includes(filter))),
    [filter, notes],
  )

  function addNote() {
    if (!title.trim() && !body.trim()) return
    void upsertNote({
      id: crypto.randomUUID(),
      title: title.trim() || 'Untitled',
      body,
      tags: [tag],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    setTitle('')
    setBody('')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="font-mono text-xs tracking-[0.18em] text-indigo-300/80 uppercase">Scratchpad</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Quick notes</h1>
      </div>
      <form
        className="glass space-y-3 rounded-3xl p-4"
        onSubmit={(event) => {
          event.preventDefault()
          addNote()
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            className="min-h-11 rounded-2xl bg-slate-950/50 px-4 text-sm outline-none ring-1 ring-white/10"
          />
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="min-h-11 rounded-2xl bg-slate-950/50 px-3 text-sm outline-none ring-1 ring-white/10"
          >
            {NOTE_TAGS.map((item) => (
              <option key={item} value={item}>
                #{item}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Meeting notes, commands, or a random idea"
          className="font-mono min-h-28 w-full rounded-2xl bg-slate-950/50 p-4 text-sm outline-none ring-1 ring-white/10"
        />
        <button type="submit" className="min-h-11 rounded-2xl bg-indigo-500 px-5 text-sm font-medium text-white">
          Save note
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-10 rounded-full px-3 text-xs ${filter === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'}`}
        >
          All
        </button>
        {NOTE_TAGS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`min-h-10 rounded-full px-3 text-xs ${filter === item ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'}`}
          >
            #{item}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((note) => (
          <article key={note.id} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">{note.title}</h2>
                <p className="font-mono mt-1 text-[11px] text-indigo-300">
                  {note.tags.map((item) => `#${item}`).join(' ')}
                </p>
              </div>
              <button type="button" onClick={() => void removeNote(note.id)} className="text-xs text-rose-300">
                Delete
              </button>
            </div>
            <pre
              className={`mt-3 whitespace-pre-wrap text-sm text-slate-300 ${looksLikeCode(note.body, note.tags) ? 'font-mono rounded-2xl bg-slate-950/60 p-3' : ''}`}
            >
              {note.body}
            </pre>
          </article>
        ))}
      </div>
    </div>
  )
}
