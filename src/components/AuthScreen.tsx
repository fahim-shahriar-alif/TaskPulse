import { Moon, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

type AuthScreenProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  const { configured } = useAuth()
  const { theme, toggleTheme } = useTheme()

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
        <img src="/logo.png" alt="TaskyPulse" className="mb-6 h-12 w-12 rounded-2xl" />
        <p className="font-mono text-xs tracking-[0.18em] text-indigo-400 uppercase">TaskyPulse</p>
        <h1 className="mt-2 text-3xl font-semibold text-fg">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{subtitle}</p>
        {!configured && (
          <div className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 ring-1 ring-amber-400/20 dark:text-amber-100">
            Add your Firebase web config to a local <span className="font-mono">.env</span> file
            (see <span className="font-mono">.env.example</span>), then restart the dev server.
          </div>
        )}
        {children}
      </section>
    </div>
  )
}
