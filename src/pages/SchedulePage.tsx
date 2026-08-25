import { formatHourLabel } from '../lib/dates'
import { eyebrowClass, titleClass } from '../lib/ui'
import { updateSlot, useStore } from '../context/StoreContext'

export function SchedulePage() {
  const { day, saveDay, resetSchedule } = useStore()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={eyebrowClass}>Time</p>
          <h1 className={titleClass}>Time-block scheduler</h1>
        </div>
        <button
          type="button"
          onClick={() => void resetSchedule()}
          className="min-h-11 rounded-2xl px-4 text-sm text-amber-600 ring-1 ring-amber-400/30 dark:text-amber-200"
        >
          Reset schedule
        </button>
      </div>
      <div className="space-y-2">
        {day.schedule.map((slot) => (
          <div key={slot.id} className="glass grid grid-cols-[7.5rem_1fr] items-center rounded-2xl">
            <p className="font-mono px-4 text-xs text-indigo-400">{formatHourLabel(slot.time)}</p>
            <input
              value={slot.activity}
              onChange={(event) => void saveDay({ schedule: updateSlot(day.schedule, slot.id, event.target.value) })}
              className="min-h-14 bg-transparent px-4 text-sm text-fg outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
