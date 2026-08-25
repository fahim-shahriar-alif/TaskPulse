import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { fieldClass } from '../lib/ui'

export function LoginPage() {
  const { configured, signIn, register, error, busy } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(mode: 'signin' | 'register') {
    const nextEmail = email.trim()
    if (!nextEmail || !password) return
    if (mode === 'register') void register(nextEmail, password)
    else void signIn(nextEmail, password)
  }

  return (
    <div className="bg-app flex min-h-dvh items-center justify-center px-4">
      <section className="glass relative w-full max-w-md rounded-3xl p-8">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-2xl text-muted"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-400/30 light:bg-brand light:text-white light:ring-0">
          <span className="text-lg font-semibold">T</span>
        </div>
        <p className="font-mono text-xs tracking-[0.18em] text-indigo-400 uppercase">TaskyPulse</p>
        <h1 className="mt-2 text-3xl font-semibold text-fg">Sign in to continue</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use email and password. Create an account the first time, then sign in on every device.
        </p>
        {!configured && (
          <div className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 ring-1 ring-amber-400/20 dark:text-amber-100">
            Add your Firebase web config to a local <span className="font-mono">.env</span> file
            (see <span className="font-mono">.env.example</span>), then restart the dev server.
          </div>
        )}
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            submit('signin')
          }}
        >
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className={`${fieldClass} min-h-12 w-full`}
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password (min 6 characters)"
            className={`${fieldClass} min-h-12 w-full`}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={!configured || busy}
            className="min-h-12 w-full rounded-2xl bg-indigo-500 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Please wait…' : 'Sign in'}
          </button>
          <button
            type="button"
            disabled={!configured || busy}
            onClick={() => submit('register')}
            className="min-h-12 w-full rounded-2xl font-medium text-indigo-400 ring-1 ring-indigo-400/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create account
          </button>
        </form>
      </section>
    </div>
  )
}
