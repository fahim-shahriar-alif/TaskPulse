import { useStore } from '../context/StoreContext'
import { attendanceOn, toggleAttendanceStatus } from '../lib/attendance'

export function AttendanceToggle({ classId, date }: { classId: string; date: string }) {
  const { attendance, setAttendance } = useStore()
  const current = attendanceOn(attendance, classId, date)?.status

  return (
    <div className="mt-2 flex gap-2">
      <button
        type="button"
        onClick={() => void setAttendance(classId, date, toggleAttendanceStatus(current, 'present'))}
        className={`min-h-9 flex-1 rounded-xl text-xs ${
          current === 'present' ? 'bg-emerald-500 text-white' : 'bg-card text-muted ring-1 ring-line'
        }`}
      >
        Present
      </button>
      <button
        type="button"
        onClick={() => void setAttendance(classId, date, toggleAttendanceStatus(current, 'missed'))}
        className={`min-h-9 flex-1 rounded-xl text-xs ${
          current === 'missed' ? 'bg-rose-500 text-white' : 'bg-card text-muted ring-1 ring-line'
        }`}
      >
        Missed
      </button>
    </div>
  )
}
