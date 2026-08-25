import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { configured, signIn, error, loading } = useAuth()

  return (
    <div className="bg-app flex min-h-dvh items-center justify-center px-4">
      <section className="glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <p className="font-mono text-xs tracking-[0.18em] text-indigo-300/80 uppercase">TaskPulse Pro</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Sign in to continue</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Google sign-in syncs tasks, habits, and notes across your Mac, iPad, and Android shortcut.
        </p>
        {!configured && (
          <div className="mt-5 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100 ring-1 ring-amber-400/20">
            Add your Firebase web config to a local <span className="font-mono">.env</span> file
            (see <span className="font-mono">.env.example</span>), then restart the dev server.
          </div>
        )}
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <button
          type="button"
          disabled={!configured || loading}
          onClick={() => void signIn()}
          className="mt-6 min-h-12 w-full rounded-2xl bg-indigo-500 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue with Google
        </button>
      </section>
    </div>
  )
}
