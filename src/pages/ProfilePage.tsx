import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import { useTheme } from '../context/ThemeContext'
import { fieldClass, eyebrowClass, titleClass } from '../lib/ui'

export function ProfilePage() {
  const { user, logout, updateName } = useAuth()
  const { tasks, habits, notes, sessions, classes, deadlines, saveSettings } = useStore()
  const { theme, toggleTheme } = useTheme()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
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
