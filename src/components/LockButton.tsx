import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLock } from '../context/LockContext'

export function LockButton({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const { lock, hasPassword } = useLock()
  const navigate = useNavigate()

  function onLock() {
    if (!hasPassword) {
      navigate('/profile#lock-password')
      return
    }
    lock()
  }

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={onLock}
        className="glass flex min-h-16 w-full items-center justify-between rounded-3xl px-5 text-left"
      >
        <span>
          <span className="block text-sm font-medium text-fg">Lock screen</span>
          <span className="text-xs text-muted">
            {hasPassword ? 'Hide the app until you enter your lock password' : 'Set a lock password in Profile first'}
          </span>
        </span>
        <Lock className="h-4 w-4 text-faint" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onLock}
      className="grid h-11 w-11 place-items-center rounded-2xl text-muted hover:bg-field hover:text-fg"
      aria-label={hasPassword ? 'Lock screen' : 'Set a lock password in Profile'}
      title={hasPassword ? 'Lock screen' : 'Set a lock password in Profile'}
    >
      <Lock className="h-5 w-5" />
    </button>
  )
}
