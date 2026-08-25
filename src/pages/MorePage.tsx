import { Link } from 'react-router-dom'
import { ProgressReportButton } from '../components/ProgressReportButton'
import { eyebrowClass, titleClass } from '../lib/ui'

const links = [
  { to: '/profile', label: 'Profile', hint: 'Account, theme, and sign out' },
  { to: '/schedule', label: 'Schedule', hint: 'From–to time ranges' },
  { to: '/habits', label: 'Habits', hint: 'Streaks and daily check-ins' },
  { to: '/classes', label: 'Classes', hint: 'University timetable' },
  { to: '/notes', label: 'Notes', hint: 'Scratchpad and snippets' },
  { to: '/matrix', label: 'Matrix', hint: 'Eisenhower quadrants' },
  { to: '/stats', label: 'Stats', hint: 'Weekly productivity' },
]

export function MorePage() {
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className={eyebrowClass}>More</p>
        <h1 className={titleClass}>Workspace</h1>
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="glass flex min-h-16 items-center justify-between rounded-3xl px-5"
          >
            <span>
              <span className="block text-sm font-medium text-fg">{link.label}</span>
              <span className="text-xs text-muted">{link.hint}</span>
            </span>
            <span className="text-faint">→</span>
          </Link>
        ))}
      </div>
      <div className="glass space-y-3 rounded-3xl p-4">
        <div>
          <h2 className="text-sm font-semibold text-fg">Report</h2>
          <p className="mt-1 text-xs text-muted">Print a PDF of your tasks, habits, focus time, and notes.</p>
        </div>
        <ProgressReportButton />
      </div>
    </div>
  )
}
