const OFFSET_KEY = 'tp-time-offset'
const RESYNC_EVERY_MS = 10 * 60 * 1000
const MIN_SYNC_GAP_MS = 45_000

let offsetMs = readOffset()
let lastSyncAt = 0
let inflight: Promise<boolean> | null = null
const listeners = new Set<() => void>()

function readOffset() {
  try {
    const raw = sessionStorage.getItem(OFFSET_KEY)
    const value = raw ? Number(raw) : 0
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

function writeOffset(value: number) {
  offsetMs = value
  try {
    sessionStorage.setItem(OFFSET_KEY, String(value))
  } catch {
    /* private mode */
  }
}

function emit() {
  for (const listener of listeners) listener()
}

async function fetchWithTimeout(url: string, timeoutMs = 4000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

async function unixMsFromTimeApi() {
  const response = await fetchWithTimeout('https://timeapi.io/api/Time/current/zone?timeZone=UTC')
  if (!response.ok) throw new Error('timeapi')
  const data = (await response.json()) as {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    seconds: number
    milliSeconds?: number
  }
  return Date.UTC(
    data.year,
    data.month - 1,
    data.day,
    data.hour,
    data.minute,
    data.seconds,
    data.milliSeconds ?? 0,
  )
}

async function unixMsFromCloudflare() {
  const response = await fetchWithTimeout('https://cloudflare.com/cdn-cgi/trace')
  if (!response.ok) throw new Error('cloudflare')
  const body = await response.text()
  const match = body.match(/^ts=([0-9.]+)/m)
  if (!match) throw new Error('cloudflare-parse')
  return Number(match[1]) * 1000
}

async function unixMsFromWorldTime() {
  const response = await fetchWithTimeout('https://worldtimeapi.org/api/timezone/Etc/UTC')
  if (!response.ok) throw new Error('worldtime')
  const data = (await response.json()) as { unixtime?: number; utc_datetime?: string }
  if (typeof data.unixtime === 'number') return data.unixtime * 1000
  if (data.utc_datetime) {
    const parsed = Date.parse(data.utc_datetime)
    if (Number.isFinite(parsed)) return parsed
  }
  throw new Error('worldtime-parse')
}

async function pullUnixMs() {
  const errors: unknown[] = []
  for (const source of [unixMsFromTimeApi, unixMsFromCloudflare, unixMsFromWorldTime]) {
    try {
      const value = await source()
      if (Number.isFinite(value) && value > 0) return value
    } catch (error) {
      errors.push(error)
    }
  }
  throw errors[0] ?? new Error('cloud-time')
}

export function nowMs() {
  return Date.now() + offsetMs
}

export function nowDate() {
  return new Date(nowMs())
}

export function onClockSync(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function syncCloudTime(force = false) {
  if (inflight) return inflight
  if (!force && lastSyncAt && Date.now() - lastSyncAt < MIN_SYNC_GAP_MS) return true

  inflight = (async () => {
    const t0 = Date.now()
    try {
      const serverMs = await pullUnixMs()
      const t1 = Date.now()
      writeOffset(serverMs + (t1 - t0) / 2 - t1)
      lastSyncAt = Date.now()
      emit()
      return true
    } catch {
      return false
    }
  })().finally(() => {
    inflight = null
  })

  return inflight
}

if (typeof window !== 'undefined') {
  void syncCloudTime(true)
  const resyncId = window.setInterval(() => {
    void syncCloudTime(true)
  }, RESYNC_EVERY_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncCloudTime()
  })
  if (import.meta.hot) {
    import.meta.hot.dispose(() => window.clearInterval(resyncId))
  }
}
