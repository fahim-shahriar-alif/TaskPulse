import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useTheme } from '../context/ThemeContext'
import {
  notificationPermission,
  requestNotificationPermission,
  showNotice,
} from '../lib/notifications'
import { fieldClass, eyebrowClass, titleClass } from '../lib/ui'

const LEAD_MINS = [5, 10, 15, 30] as const

function isiPadLike() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function ProfilePage() {
  const { user, logout, updateName } = useAuth()
  const { tasks, habits, notes, sessions, classes, deadlines, settings, saveSettings } = useStore()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [notifyHint, setNotifyHint] = useState('')
  const permission = notificationPermission()
  const initial = (user?.displayName || user?.email || 'T').slice(0, 1).toUpperCase()
  const joined = user?.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—'

  async function saveName() {
    setError('')
    try {
      await updateName(name)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
    } catch {
      setError('Could not save display name.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <p className={eyebrowClass}>Account</p>
        <h1 className={titleClass}>Profile</h1>
      </div>

      <section className="glass flex items-center gap-4 rounded-3xl p-5">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-indigo-500/15 text-xl font-semibold text-indigo-400">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-fg">{user?.displayName || 'TaskyPulse user'}</p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
          <p className="font-mono mt-1 text-[11px] text-faint">Joined {joined}</p>
        </div>
      </section>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-fg">Display name</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className={`${fieldClass} w-full`}
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="button"
          onClick={() => void saveName()}
          className="min-h-11 rounded-2xl bg-indigo-500 px-4 text-sm font-medium text-white"
        >
          {saved ? 'Saved' : 'Save name'}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ['Tasks', tasks.length],
          ['Habits', habits.length],
          ['Classes', classes.length],
          ['Exams', deadlines.length],
          ['Notes', notes.length],
          ['Focus sessions', sessions.length],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-3xl p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-mono mt-1 text-2xl text-fg">{value}</p>
          </div>
        ))}
      </section>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-fg">Reminders</h2>
        <p className="text-xs text-muted">
          Get alerts before class, the day an exam is due, and when tasks slip. On iPad, add TaskyPulse to the Home
          Screen first, then allow notifications.
        </p>
        <button
          type="button"
          onClick={() => {
            const active = settings.notifyEnabled && permission === 'granted'
            if (active) {
              setNotifyHint('')
              void saveSettings({ notifyEnabled: false })
              return
            }
            void requestNotificationPermission().then((perm) => {
              if (perm !== 'granted') {
                setNotifyHint(
                  perm === 'denied'
                    ? 'Notifications are blocked. Allow them in iPad Settings → Notifications, then try again.'
                    : 'Notifications are not available in this browser.',
                )
                return
              }
              setNotifyHint(isiPadLike() ? 'Allowed. Keep the app on your Home Screen so reminders can appear.' : '')
              void saveSettings({ notifyEnabled: true })
            })
          }}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-field px-4 text-sm text-fg ring-1 ring-line"
        >
          <span>Enable reminders</span>
          <span className="text-muted">{settings.notifyEnabled && permission === 'granted' ? 'On' : 'Off'}</span>
        </button>
        {notifyHint ? <p className="text-xs text-amber-500">{notifyHint}</p> : null}
        {settings.notifyEnabled && permission === 'granted' && (
          <>
            <button
              type="button"
              onClick={() =>
                void showNotice({
                  tag: `test-${Date.now()}`,
                  title: 'TaskyPulse',
                  body: 'Reminders are working. You’ll get class, exam, and overdue alerts.',
                  url: '/',
                })
              }
              className="min-h-11 w-full rounded-2xl text-sm text-indigo-400 ring-1 ring-line"
            >
              Send a test notification
            </button>
            {(
              [
                ['notifyClasses', 'Classes'],
                ['notifyDeadlines', 'Exams & deadlines'],
                ['notifyTasks', 'Overdue tasks'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => void saveSettings({ [key]: !settings[key] })}
                className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-field px-4 text-sm text-fg ring-1 ring-line"
              >
                <span>{label}</span>
                <span className="text-muted">{settings[key] ? 'On' : 'Off'}</span>
              </button>
            ))}
            <div>
              <p className="mb-2 text-xs text-muted">Warn me before class</p>
              <div className="flex flex-wrap gap-2">
                {LEAD_MINS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => void saveSettings({ classLeadMins: mins })}
                    className={`min-h-10 rounded-full px-3 text-xs ${
                      settings.classLeadMins === mins ? 'bg-indigo-500 text-white' : 'bg-field text-muted ring-1 ring-line'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h2 className="text-sm font-semibold text-fg">Appearance</h2>
        <button
          type="button"
          onClick={() => {
            const next = theme === 'dark' ? 'light' : 'dark'
            toggleTheme()
            void saveSettings({ theme: next })
          }}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-field px-4 text-sm text-fg ring-1 ring-line"
        >
          <span>Theme</span>
          <span className="text-muted">{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </section>

      <button
        type="button"
        onClick={() => void logout()}
        className="min-h-12 w-full rounded-2xl text-sm font-medium text-rose-400 ring-1 ring-rose-400/25"
      >
        Sign out
      </button>
    </div>
  )
}
