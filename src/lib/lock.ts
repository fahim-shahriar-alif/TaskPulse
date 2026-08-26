export const LOCK_MIN_LENGTH = 4

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export function lockStorageKey(uid: string) {
  return `tp-locked:${uid}`
}

export function clearAllLockFlags() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('tp-locked:')) localStorage.removeItem(key)
  }
}

export function randomLockSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
}

export async function hashLockPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}\0${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

export async function lockPasswordMatches(password: string, salt: string, hash: string) {
  if (!salt || !hash) return false
  const next = await hashLockPassword(password, salt)
  return timingSafeEqual(next, hash)
}
