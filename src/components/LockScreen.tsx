import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLock } from '../context/LockContext'
import { useStore } from '../context/StoreContext'
import { formatDayLabel } from '../lib/dates'
import { sessionQuote, sessionWallpaper } from '../lib/wallpapers'
import { useNow } from '../lib/now'
import { PasswordField } from './PasswordField'
import { UserAvatar } from './UserAvatar'

const OPEN_AT = 80
const LOCK_BG = '#05070d'

export function LockScreen() {
  const { user, logout } = useAuth()
  const { settings } = useStore()
  const { unlock, release } = useLock()
  const now = useNow(1000)
  const [sheet, setSheet] = useState(false)
  const [drag, setDrag] = useState(0)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wallpaper] = useState(() => sessionWallpaper())
  const [quote] = useState(() => sessionQuote())
  const startY = useRef<number | null>(null)
  const dragRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const name = user?.displayName || user?.email?.split('@')[0] || 'TaskyPulse'
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (sheet) inputRef.current?.focus()
  }, [sheet])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (sheet) return
      if (event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setSheet(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet])

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (sheet) return
    startY.current = event.clientY
    dragRef.current = 0
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (startY.current == null || sheet) return
    const next = Math.max(0, Math.min(220, startY.current - event.clientY))
    dragRef.current = next
    setDrag(next)
  }

  function onPointerUp() {
    if (startY.current == null) return
    if (dragRef.current >= OPEN_AT) setSheet(true)
    startY.current = null
    dragRef.current = 0
    setDrag(0)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const ok = await unlock(password)
    setBusy(false)
    if (!ok) {
      setError('That password does not match.')
      setPassword('')
      inputRef.current?.focus()
    }
  }

  const lift = sheet ? 48 : drag

  const screen = (
    <div
      className={`fixed inset-0 z-[200] flex flex-col overflow-hidden text-white ${sheet ? '' : 'touch-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Screen locked"
      style={{ background: LOCK_BG }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={wallpaper}
        alt=""
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/25 to-black/75" />

      <header
        className="relative z-[2] px-6 pt-[max(3.25rem,env(safe-area-inset-top))] text-center transition-transform duration-200"
        style={{ transform: `translateY(${-lift * 0.2}px)` }}
      >
        <time
          dateTime={now.toISOString()}
          className="block font-mono text-[clamp(4.5rem,18vw,7.5rem)] font-semibold leading-none tabular-nums tracking-tight"
        >
          {time}
        </time>
        <p className="mt-3 text-lg text-white/70">{formatDayLabel(now)}</p>
      </header>

      {!sheet ? (
        <div className="relative z-[2] mt-auto px-8 pb-4 text-center">
          <blockquote>
            <p className="text-base leading-relaxed text-white/80 italic sm:text-lg">“{quote.text}”</p>
            {quote.by ? <footer className="mt-2 text-sm text-white/40">— {quote.by}</footer> : null}
          </blockquote>
        </div>
      ) : null}

      <div className="relative z-[2] mt-auto">
        {!sheet ? (
          <div className="flex flex-col items-center pb-[max(2rem,env(safe-area-inset-bottom))]">
            <UserAvatar photo={settings.photo} name={name} size="xl" className="ring-1 ring-white/20" />
            <p className="mt-3 text-lg font-medium">{name}</p>
            {user?.email ? <p className="mt-1 text-sm text-white/50">{user.email}</p> : null}
            <button
              type="button"
              className="mt-8 flex flex-col items-center gap-1 text-white/55"
              onClick={() => setSheet(true)}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <ChevronUp className="h-7 w-7 animate-bounce" />
              <span className="text-sm">Slide up to unlock</span>
            </button>
          </div>
        ) : (
          <form
            className="flex min-h-[55dvh] w-full flex-col justify-end space-y-3 bg-black/55 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 backdrop-blur-2xl"
            onSubmit={(event) => void submit(event)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex flex-col items-center">
              <UserAvatar photo={settings.photo} name={name} size="lg" className="ring-1 ring-white/20" />
              <p className="mt-3 text-base font-medium">{name}</p>
            </div>
            <p className="text-center text-sm text-white/70">Enter your lock password</p>
            <PasswordField
              ref={inputRef}
              tone="lock"
              value={password}
              name="taskypulse-lock"
              autoComplete="off"
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              placeholder="Password"
              className="tp-password-lock"
            />
            {error ? <p className="text-center text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || !password}
              className="min-h-12 w-full rounded-2xl bg-indigo-500 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy ? 'Unlocking…' : 'Unlock'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSheet(false)
                setPassword('')
                setError('')
              }}
              className="min-h-11 w-full text-sm text-white/45 hover:text-white/80"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                release()
                void logout()
              }}
              className="min-h-11 w-full text-sm text-white/45 hover:text-white/80"
            >
              Sign out instead
            </button>
          </form>
        )}
      </div>
    </div>
  )

  return createPortal(screen, document.body)
}
