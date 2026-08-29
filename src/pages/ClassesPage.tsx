import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { DeadlineModal } from '../components/DeadlineModal'
import { Modal } from '../components/Modal'
import { useStore } from '../context/StoreContext'
import {
  REPEAT_OPTIONS,
  UNIVERSITY_SLOTS,
  WEEKDAYS,
  classKind,
  classKindLabel,
  classMeetsOn,
  emptyClass,
  formatClassTime,
  formatDays,
  matchingUniversitySlot,
  overlappingClasses,
  universitySlotLabel,
} from '../lib/classes'
import { notesForClass } from '../lib/classNotes'
import { examsForClass, formatDaysLeft } from '../lib/deadlines'
import { todayKey } from '../lib/dates'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import type { UniClass, WeekDay } from '../types'
import { CLASS_KINDS } from '../types'

export function ClassesPage() {
  const { classes, deadlines, classNotes, upsertClass, removeClass } = useStore()
  const [open, setOpen] = useState(false)
  const [slotOpen, setSlotOpen] = useState(false)
  const [draft, setDraft] = useState<UniClass>(emptyClass)
  const [examClassId, setExamClassId] = useState<string | null>(null)
  const today = todayKey()
  const todayClasses = useMemo(() => classes.filter((item) => classMeetsOn(item, today)), [classes, today])
  const draftClash = useMemo(() => overlappingClasses(draft, classes), [classes, draft])
  const clashNote = draftClash.map((item) => `${item.name} (${formatClassTime(item)})`).join(' · ')

  function edit(item?: UniClass) {
    setDraft(item ? { ...item } : emptyClass())
    setSlotOpen(false)
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
          <p className={eyebrowClass}>Timetable</p>
          <h1 className={titleClass}>Classes</h1>
          <p className="mt-2 text-sm text-muted">
            University, or Others with a name you write. Then pick days and from–to times.
          </p>
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
                  <p className="mt-0.5 text-[11px] text-faint">{classKindLabel(item)}</p>
                  {item.location ? <p className="text-xs text-muted">{item.location}</p> : null}
                  {clash.length > 0 ? (
                    <p className="mt-1 text-[11px] text-amber-500">
                      Overlaps {clash.map((other) => other.name).join(' · ')}
                    </p>
                  ) : null}
                  <Link
                    to={`/class-notes/${item.id}?date=${today}`}
                    className="mt-2 inline-flex min-h-9 items-center rounded-full bg-card px-3 text-xs text-indigo-400 ring-1 ring-line"
                  >
                    {(() => {
                      const count = notesForClass(classNotes, item.id).length
                      return count ? `Class notes · ${count}` : 'Add class notes'
                    })()}
                  </Link>
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
          const photoCount = notesForClass(classNotes, item.id).length
          return (
          <article
            key={item.id}
            className={`glass rounded-3xl p-5 ${clash.length ? 'ring-1 ring-amber-400/40' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-fg">{item.name}</h2>
                <p className="mt-0.5 text-[11px] font-medium text-indigo-400">{classKindLabel(item)}</p>
                {item.course && classKind(item) === 'university' ? (
                  <p className="text-sm text-muted">{item.course}</p>
                ) : null}
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
              <Link
                to={`/class-notes/${item.id}`}
                className="grid min-h-11 flex-1 place-items-center rounded-2xl bg-field text-sm text-fg ring-1 ring-line"
              >
                Notes{photoCount ? ` · ${photoCount}` : ''}
              </Link>
              <button
                type="button"
                onClick={() => setExamClassId(item.id)}
                className="min-h-11 flex-1 rounded-2xl bg-indigo-500 text-sm font-medium text-white"
              >
                Add exam
              </button>
            </div>
          </article>
          )
        })}
      </div>

      {classes.length === 0 && (
        <div className="glass rounded-3xl p-6 text-center">
          <p className="text-sm text-muted">No classes yet. Add a university class or write an Others name.</p>
        </div>
      )}

      <Modal
        open={open}
        title={draft.name ? 'Edit class' : 'New class'}
        onClose={() => {
          setSlotOpen(false)
          setOpen(false)
        }}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draft.name.trim() || draft.days.length === 0 || draftClash.length > 0) return
            void upsertClass({ ...draft, name: draft.name.trim() })
            setOpen(false)
          }}
        >
          <div>
            <p className="mb-2 text-xs text-muted">Type</p>
            <div className="flex flex-wrap gap-2">
              {CLASS_KINDS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      kind: option.id,
                      course: option.id === 'other' ? '' : draft.course,
                      ...(option.id === 'university' && !matchingUniversitySlot(draft.from, draft.to)
                        ? { from: UNIVERSITY_SLOTS[0].from, to: UNIVERSITY_SLOTS[0].to }
                        : {}),
                    })
                  }
                  className={`min-h-10 rounded-full px-3 text-xs ${
                    classKind(draft) === option.id ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder={classKind(draft) === 'other' ? 'Write the name' : 'Class name'}
            className={`${fieldClass} w-full`}
            required
          />
          {classKind(draft) === 'university' ? (
            <input
              value={draft.course}
              onChange={(event) => setDraft({ ...draft, course: event.target.value })}
              placeholder="Course code (optional)"
              className={`${fieldClass} w-full`}
            />
          ) : null}
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
          {classKind(draft) === 'university' ? (
            <div>
              <p className="mb-2 text-xs text-muted">Period</p>
              <button
                type="button"
                onClick={() => setSlotOpen(true)}
                className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-field px-4 text-left text-sm text-fg ring-1 ring-line"
              >
                <span>
                  {matchingUniversitySlot(draft.from, draft.to)
                    ? universitySlotLabel({ from: draft.from, to: draft.to })
                    : 'Choose a period'}
                </span>
                <span className="text-faint">→</span>
              </button>
            </div>
          ) : (
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
          )}
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

      <Modal open={slotOpen} title="Choose a period" stacked onClose={() => setSlotOpen(false)}>
        <p className="mb-3 text-xs text-muted">1.5 hours, 10 min break after each class. Evening is 6:30–9:30 pm.</p>
        <div className="space-y-2">
          {UNIVERSITY_SLOTS.map((slot) => {
            const on = draft.from === slot.from && draft.to === slot.to
            return (
              <button
                key={`${slot.from}-${slot.to}`}
                type="button"
                onClick={() => {
                  setDraft({ ...draft, from: slot.from, to: slot.to })
                  setSlotOpen(false)
                }}
                className={`flex min-h-11 w-full items-center rounded-2xl px-4 text-left text-sm ${
                  on ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'
                }`}
              >
                {universitySlotLabel(slot)}
              </button>
            )
          })}
        </div>
      </Modal>

      <DeadlineModal
        open={Boolean(examClassId)}
        classId={examClassId ?? ''}
        onClose={() => setExamClassId(null)}
      />
    </div>
  )
}
