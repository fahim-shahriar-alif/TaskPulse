import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLock } from '../context/LockContext'
import { formatDayLabel } from '../lib/dates'
import { useNow } from '../lib/now'
import { PasswordField } from './PasswordField'

const OPEN_AT = 80
const LOCK_BG = '#05070d'
const WALLPAPERS = ['/lock/lock-city-web.png', '/lock/lock-street-web.png', '/lock/lock-web-graphic.png']

function LockWeb() {
  return (
    <svg className="lock-web-spin pointer-events-none absolute inset-x-0 top-[-20%] h-[85%] w-full" viewBox="0 0 100 100" aria-hidden>
      <g className="lock-web-pulse" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35">
        {['12', '28', '44', '62', '82'].map((r) => (
          <ellipse key={r} cx="50" cy="0" rx={r} ry={Number(r) * 0.72} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i * 15 - 90) * Math.PI) / 180
          return <line key={i} x1="50" y1="0" x2={50 + Math.cos(a) * 92} y2={Math.sin(a) * 78} />
        })}
      </g>
    </svg>
  )
}

export function LockScreen() {
  const { user, logout } = useAuth()
  const { unlock, release } = useLock()
  const now = useNow(1000)
  const [sheet, setSheet] = useState(false)
  const [drag, setDrag] = useState(0)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wallpaper] = useState(() => WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)])
  const startY = useRef<number | null>(null)
  const dragRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const name = user?.displayName || user?.email?.split('@')[0] || 'TaskyPulse'
  const initial = name.slice(0, 1).toUpperCase()
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
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

  const lift = sheet ? 120 : drag

  return (
    <div
      className="fixed inset-0 z-[100] flex touch-none flex-col overflow-hidden text-white"
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
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <LockWeb />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
      <div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)] transition-transform duration-200"
        style={{ transform: `translateY(${-lift * 0.35}px)` }}
      >
        <time dateTime={now.toISOString()} className="font-mono text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl">
          {time}
        </time>
        <p className="mt-3 text-lg text-white/70">{formatDayLabel(now)}</p>
        <div className="mt-12 grid h-20 w-20 place-items-center rounded-full bg-white/10 text-2xl font-semibold ring-1 ring-white/20">
          {initial}
        </div>
        <p className="mt-3 text-lg font-medium">{name}</p>
        {user?.email ? <p className="mt-1 text-sm text-white/50">{user.email}</p> : null}
      </div>

      <div className="relative z-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {!sheet ? (
          <button
            type="button"
            className="mx-auto flex flex-col items-center gap-1 pb-8 text-white/55"
            onClick={() => setSheet(true)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronUp className="h-7 w-7 animate-bounce" />
            <span className="text-sm">Slide up to unlock</span>
          </button>
        ) : (
          <form
            className="mx-auto w-full max-w-sm space-y-3 rounded-t-3xl bg-white/10 px-5 pb-6 pt-5 ring-1 ring-white/15 backdrop-blur-xl"
            onSubmit={(event) => void submit(event)}
            onPointerDown={(event) => event.stopPropagation()}
          >
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
              className="tp-password-lock bg-[#0c2236] text-white placeholder:text-white/40"
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
}
