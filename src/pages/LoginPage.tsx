import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthScreen } from '../components/AuthScreen'
import { PasswordField } from '../components/PasswordField'
import { useAuth } from '../context/AuthContext'
import { fieldClass } from '../lib/ui'

export function LoginPage() {
  const { configured, signIn, error, busy, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    clearError()
  }, [clearError])

  function submit() {
    const nextEmail = email.trim()
    if (!nextEmail || !password) return
    void signIn(nextEmail, password)
  }

  return (
    <AuthScreen
      title="Sign in to continue"
      subtitle="Use the email and password for your TaskyPulse account. New here? Create an account first."
    >
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
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
        <PasswordField
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="min-h-12"
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={!configured || busy}
          className="min-h-12 w-full rounded-2xl bg-indigo-500 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Please wait…' : 'Sign in'}
        </button>
        <p className="pt-1 text-center text-sm text-muted">
          New to TaskyPulse?{' '}
          <Link to="/register" className="font-medium text-indigo-400">
            Create an account
          </Link>
        </p>
      </form>
    </AuthScreen>
  )
}
