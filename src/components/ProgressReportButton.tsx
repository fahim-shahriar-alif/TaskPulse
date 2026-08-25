import { FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { printProgressPdf } from '../lib/progressReport'

type ProgressReportButtonProps = {
  variant?: 'card' | 'sidebar' | 'icon'
}

export function ProgressReportButton({ variant = 'card' }: ProgressReportButtonProps) {
  const { user } = useAuth()
  const { tasks, habits, notes, sessions, day } = useStore()

  function run() {
    try {
      printProgressPdf({
        name: user?.displayName || 'TaskyPulse user',
        email: user?.email || '',
        joined: user?.metadata.creationTime
          ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : '—',
        tasks: tasks ?? [],
        habits: habits ?? [],
        notes: notes ?? [],
        sessions: sessions ?? [],
        day,
      })
    } catch {
      window.alert('Could not build the progress report.')
    }
  }

  if (variant === 'icon') {
    return (
      <button type="button" onClick={run} className="grid h-11 w-11 place-items-center text-muted" aria-label="Progress report">
        <FileText className="h-5 w-5" />
      </button>
    )
  }

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={run}
        className="flex min-h-11 w-full items-center gap-2 rounded-2xl bg-field px-3 text-left text-sm text-fg ring-1 ring-line"
      >
        <FileText className="h-4 w-4 text-indigo-400" />
        Progress report
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={run}
      className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-indigo-500 px-4 text-sm font-medium text-white"
    >
      <span>Progress report</span>
      <FileText className="h-4 w-4" />
    </button>
  )
}
