import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { useStore } from '../context/StoreContext'
import {
  REPEAT_OPTIONS,
  WEEKDAYS,
  classMeetsOn,
  emptyClass,
  formatClassTime,
  formatDays,
} from '../lib/classes'
import { todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { UniClass, WeekDay } from '../types'

export function ClassesPage() {
  const { classes, upsertClass, removeClass } = useStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<UniClass>(emptyClass)
  const today = todayKey()
  const todayClasses = useMemo(() => classes.filter((item) => classMeetsOn(item, today)), [classes, today])

  function edit(item?: UniClass) {
    setDraft(item ? { ...item } : emptyClass())
    setOpen(true)
  }

  function toggleDay(id: WeekDay) {
    setDraft((current) => ({
      ...current,
      days: current.days.includes(id) ? current.days.filter((day) => day !== id) : [...current.days, id],
    }))
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>University</p>
          <h1 className={titleClass}>Classes</h1>
          <p className="mt-2 text-sm text-muted">Pick days, set from–to times, and repeat weekly or every two weeks.</p>
        </div>
        <button
          type="button"
          onClick={() => edit()}
          className="min-h-11 rounded-2xl bg-indigo-500 px-4 text-sm font-medium text-white"
        >
          Add class
        </button>
      </div>

      {todayClasses.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Today</h2>
          <div className="mt-3 space-y-2">
            {todayClasses.map((item) => (
              <div key={item.id} className="rounded-2xl bg-field px-4 py-3 ring-1 ring-line">
                <p className="font-mono text-xs text-indigo-400">{formatClassTime(item)}</p>
                <p className="mt-1 text-sm font-medium text-fg">{item.name}</p>
                {item.location ? <p className="text-xs text-muted">{item.location}</p> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((item) => (
          <article key={item.id} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-fg">{item.name}</h2>
                {item.course ? <p className="text-sm text-muted">{item.course}</p> : null}
              </div>
              <button type="button" onClick={() => void removeClass(item.id)} className="text-xs text-rose-400">
                Delete
              </button>
            </div>
            <p className="font-mono mt-3 text-xs text-indigo-400">{formatClassTime(item)}</p>
            <p className="mt-1 text-sm text-fg">{formatDays(item.days)}</p>
            <p className="mt-1 text-xs text-faint">
              {REPEAT_OPTIONS.find((option) => option.id === item.repeat)?.label}
              {item.location ? ` · ${item.location}` : ''}
            </p>
            <button
              type="button"
              onClick={() => edit(item)}
              className="mt-4 min-h-11 w-full rounded-2xl bg-field text-sm text-fg ring-1 ring-line"
            >
              Edit
            </button>
          </article>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="glass rounded-3xl p-6 text-center">
          <p className="text-sm text-muted">No classes yet. Add a university class with its days and time.</p>
        </div>
      )}

      <Modal open={open} title={draft.name ? 'Edit class' : 'New class'} onClose={() => setOpen(false)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draft.name.trim() || draft.days.length === 0) return
            void upsertClass({ ...draft, name: draft.name.trim() })
            setOpen(false)
          }}
        >
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Class name"
            className={`${fieldClass} w-full`}
            required
          />
          <input
            value={draft.course}
            onChange={(event) => setDraft({ ...draft, course: event.target.value })}
            placeholder="Course code (optional)"
            className={`${fieldClass} w-full`}
          />
          <input
            value={draft.location}
            onChange={(event) => setDraft({ ...draft, location: event.target.value })}
            placeholder="Room or building"
            className={`${fieldClass} w-full`}
          />
          <div>
            <p className="mb-2 text-xs text-muted">Days</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const on = draft.days.includes(day.id)
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`min-h-10 rounded-full px-3 text-xs ${
                      on ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'
                    }`}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted">
              From
              <input
                type="time"
                value={draft.from}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                className={`${fieldClass} mt-1 w-full`}
              />
            </label>
            <label className="text-xs text-muted">
              To
              <input
                type="time"
                value={draft.to}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
                className={`${fieldClass} mt-1 w-full`}
              />
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs text-muted">Repeat</p>
            <div className="flex flex-wrap gap-2">
              {REPEAT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, repeat: option.id })}
                  className={`min-h-10 rounded-full px-3 text-xs ${
                    draft.repeat === option.id ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {(draft.repeat === 'once' || draft.repeat === 'biweekly') && (
            <label className="block text-xs text-muted">
              {draft.repeat === 'once' ? 'Date' : 'First week starts'}
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
                className={`${fieldClass} mt-1 w-full`}
              />
            </label>
          )}
          <textarea
            value={draft.notes}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            placeholder="Notes (optional)"
            rows={2}
            className={`${fieldClass} w-full py-3`}
          />
          <button type="submit" className="min-h-11 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white">
            Save class
          </button>
        </form>
      </Modal>
    </div>
  )
}
