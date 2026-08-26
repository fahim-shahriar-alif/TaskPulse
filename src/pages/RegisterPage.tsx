import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthScreen } from '../components/AuthScreen'
import { PasswordField } from '../components/PasswordField'
import { useAuth } from '../context/AuthContext'
import { fieldClass } from '../lib/ui'

export function RegisterPage() {
  const { configured, register, error, busy, clearError } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    clearError()
  }, [clearError])

  function submit() {
    const nextEmail = email.trim()
    setLocalError('')
    if (!nextEmail || !password) {
      setLocalError('Enter an email and a password.')
      return
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    void register(nextEmail, password, name.trim())
  }

  const message = localError || error

  return (
    <AuthScreen
      title="Create an account"
      subtitle="Email and password. Your tasks, classes, and notes stay under this login on every device."
    >
      <form
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name (optional)"
          className={`${fieldClass} min-h-12 w-full`}
        />
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className={`${fieldClass} min-h-12 w-full`}
        />
        <PasswordField
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password (min 6 characters)"
          className="min-h-12"
        />
        <PasswordField
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Confirm password"
          className="min-h-12"
        />
        {message && <p className="text-sm text-rose-400">{message}</p>}
        <button
          type="submit"
          disabled={!configured || busy}
          className="min-h-12 w-full rounded-2xl bg-indigo-500 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Please wait…' : 'Create account'}
        </button>
        <p className="pt-1 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-400">
            Sign in
          </Link>
        </p>
      </form>
    </AuthScreen>
  )
}
