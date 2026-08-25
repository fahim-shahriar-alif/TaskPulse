import { formatHourLabel } from '../lib/dates'
import { conflictNote, nextRange, newScheduleSlot, updateSlot } from '../lib/schedule'
import { eyebrowClass, fieldClass, titleClass } from '../lib/ui'
import { useStore } from '../context/StoreContext'

export function SchedulePage() {
  const { day, classes, saveDay, resetSchedule } = useStore()
  const schedule = day.schedule
  const clashes = schedule.filter((slot) => conflictNote(slot, classes, schedule, day.date))

  function persist(next = schedule) {
    void saveDay({ schedule: next })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>Time</p>
          <h1 className={titleClass}>Schedule</h1>
          <p className="mt-1 text-sm text-muted">Set your own from and to times for each part of the day.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const range = nextRange(schedule)
              persist([...schedule, newScheduleSlot(range.from, range.to)])
            }}
            className="min-h-11 rounded-2xl bg-indigo-500 px-4 text-sm font-medium text-white"
          >
            Add range
          </button>
          <button
            type="button"
            onClick={() => void resetSchedule()}
            className="min-h-11 rounded-2xl px-4 text-sm text-amber-600 ring-1 ring-amber-400/30 dark:text-amber-200"
          >
            Reset schedule
          </button>
        </div>
      </div>

      {clashes.length > 0 && (
        <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-600 ring-1 ring-amber-400/30 dark:text-amber-200">
          {clashes.length} block{clashes.length === 1 ? '' : 's'} overlap a class or another range today. Change the
          times so they do not collide.
        </p>
      )}

      <div className="space-y-3">
        {schedule.map((slot) => {
          const clash = conflictNote(slot, classes, schedule, day.date)
          return (
            <article
              key={slot.id}
              className={`glass space-y-3 rounded-3xl p-4 ${clash ? 'ring-1 ring-amber-400/40' : ''}`}
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-faint">From</span>
                  <input
                    type="time"
                    value={slot.from}
                    onChange={(event) => persist(updateSlot(schedule, slot.id, { from: event.target.value }))}
                    className={`${fieldClass} w-full`}
                  />
                </label>
                <label className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-faint">To</span>
                  <input
                    type="time"
                    value={slot.to}
                    onChange={(event) => persist(updateSlot(schedule, slot.id, { to: event.target.value }))}
                    className={`${fieldClass} w-full`}
                  />
                </label>
              </div>
              <input
                value={slot.activity}
                onChange={(event) => persist(updateSlot(schedule, slot.id, { activity: event.target.value }))}
                placeholder="What are you doing?"
                className={`${fieldClass} w-full`}
              />
              {clash ? <p className="text-xs text-amber-500">{clash}</p> : null}
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-indigo-400">
                  {formatHourLabel(slot.from)} – {formatHourLabel(slot.to)}
                </p>
                <button
                  type="button"
                  onClick={() => persist(schedule.filter((item) => item.id !== slot.id))}
                  className="text-xs text-rose-400"
                >
                  Remove
                </button>
              </div>
            </article>
          )
        })}
        {schedule.length === 0 && (
          <div className="glass rounded-3xl p-6 text-center">
            <p className="text-sm text-muted">No ranges yet. Add a from–to time and name what you’ll do.</p>
          </div>
        )}
      </div>
    </div>
  )
}
