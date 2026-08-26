import { useMemo, useState } from 'react'
import { ClassNotesSheet } from '../components/ClassNotesSheet'
import { DeadlineModal } from '../components/DeadlineModal'
import { Modal } from '../components/Modal'
import { useStore } from '../context/StoreContext'
import {
  REPEAT_OPTIONS,
  WEEKDAYS,
  classMeetsOn,
  emptyClass,
  formatClassTime,
  formatDays,
  overlappingClasses,
} from '../lib/classes'
import { classNoteDates, classNotesOn } from '../lib/classNotes'
import { examsForClass, formatDaysLeft } from '../lib/deadlines'
import { formatDayLabel, parseKey, todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { UniClass, WeekDay } from '../types'

export function ClassesPage() {
  const { classes, deadlines, classNotes, upsertClass, removeClass } = useStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<UniClass>(emptyClass)
  const [examClassId, setExamClassId] = useState<string | null>(null)
  const [notesFor, setNotesFor] = useState<{ item: UniClass; date: string } | null>(null)
  const today = todayKey()
  const todayClasses = useMemo(() => classes.filter((item) => classMeetsOn(item, today)), [classes, today])
  const draftClash = useMemo(() => overlappingClasses(draft, classes), [classes, draft])
  const clashNote = draftClash.map((item) => `${item.name} (${formatClassTime(item)})`).join(' · ')

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

      {classes.some((item) => overlappingClasses(item, classes).length > 0) && (
        <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600 ring-1 ring-amber-400/30 dark:text-amber-200">
          Two classes share a day and time. Edit one so they no longer overlap — save is blocked until they don’t.
        </p>
      )}
      {todayClasses.length > 0 && (
        <div className="glass rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-fg">Today</h2>
          <div className="mt-3 space-y-2">
            {todayClasses.map((item) => {
              const clash = overlappingClasses(item, todayClasses)
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl bg-field px-4 py-3 ring-1 ${clash.length ? 'ring-amber-400/50' : 'ring-line'}`}
                >
                  <p className="font-mono text-xs text-indigo-400">{formatClassTime(item)}</p>
                  <p className="mt-1 text-sm font-medium text-fg">{item.name}</p>
                  {item.location ? <p className="text-xs text-muted">{item.location}</p> : null}
                  {clash.length > 0 ? (
                    <p className="mt-1 text-[11px] text-amber-500">
                      Overlaps {clash.map((other) => other.name).join(' · ')}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setNotesFor({ item, date: today })}
                    className="mt-2 min-h-9 rounded-full bg-card px-3 text-xs text-indigo-400 ring-1 ring-line"
                  >
                    {(() => {
                      const count = classNotesOn(classNotes, item.id, today).length
                      return count ? `Notes · ${count}` : 'Add lecture photos'
                    })()}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((item) => {
          const upcoming = examsForClass(deadlines, item.id, today).slice(0, 3)
          const clash = overlappingClasses(item, classes)
          return (
          <article
            key={item.id}
            className={`glass rounded-3xl p-5 ${clash.length ? 'ring-1 ring-amber-400/40' : ''}`}
          >
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
            {clash.length > 0 ? (
              <p className="mt-2 text-xs text-amber-500">
                Overlaps {clash.map((other) => other.name).join(' · ')}
              </p>
            ) : null}
            {upcoming.length > 0 && (
              <div className="mt-3 space-y-1">
                {upcoming.map((exam) => (
                  <p key={exam.id} className="text-xs text-amber-500">
                    {exam.date} · {formatDaysLeft(exam.date, today)}
                    {exam.title.trim() ? ` · ${exam.title.trim()}` : ''}
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => edit(item)}
                className="min-h-11 flex-1 rounded-2xl bg-field text-sm text-fg ring-1 ring-line"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setNotesFor({ item, date: today })}
                className="min-h-11 flex-1 rounded-2xl bg-field text-sm text-fg ring-1 ring-line"
              >
                Notes
              </button>
              <button
                type="button"
                onClick={() => setExamClassId(item.id)}
                className="min-h-11 flex-1 rounded-2xl bg-indigo-500 text-sm font-medium text-white"
              >
                Add exam
              </button>
            </div>
            {classNoteDates(classNotes, item.id).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {classNoteDates(classNotes, item.id)
                  .slice(0, 6)
                  .map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNotesFor({ item, date: key })}
                      className="min-h-8 rounded-full bg-field px-3 text-[11px] text-muted ring-1 ring-line"
                    >
                      {formatDayLabel(parseKey(key))} · {classNotesOn(classNotes, item.id, key).length}
                    </button>
                  ))}
              </div>
            ) : null}
          </article>
          )
        })}
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
            if (!draft.name.trim() || draft.days.length === 0 || draftClash.length > 0) return
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
          {clashNote ? <p className="text-xs text-amber-500">Overlaps {clashNote}. Change the day or time to save.</p> : null}
          <button
            type="submit"
            disabled={draftClash.length > 0}
            className="min-h-11 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white disabled:opacity-40"
          >
            Save class
          </button>
        </form>
      </Modal>

      <DeadlineModal
        open={Boolean(examClassId)}
        classId={examClassId ?? ''}
        onClose={() => setExamClassId(null)}
      />
      {notesFor ? (
        <ClassNotesSheet item={notesFor.item} date={notesFor.date} onClose={() => setNotesFor(null)} />
      ) : null}
    </div>
  )
}
