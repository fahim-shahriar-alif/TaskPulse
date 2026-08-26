import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hashLockPassword, lockPasswordMatches, lockStorageKey, randomLockSalt } from '../lib/lock'
import { useAuth } from './AuthContext'
import { useStore } from './StoreContext'

type LockContextValue = {
  locked: boolean
  hasPassword: boolean
  lock: () => boolean
  unlock: (password: string) => Promise<boolean>
  release: () => void
  setPassword: (password: string) => Promise<void>
  changePassword: (current: string, next: string) => Promise<boolean>
  clearPassword: (current: string) => Promise<boolean>
}

const LockContext = createContext<LockContextValue | null>(null)

export function LockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { settings, saveSettings } = useStore()
  const uid = user?.uid
  const hasPassword = Boolean(settings.lockHash && settings.lockSalt)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!uid || !hasPassword) {
      setLocked(false)
      return
    }
    setLocked(localStorage.getItem(lockStorageKey(uid)) === '1')
  }, [hasPassword, uid])

  const persist = useCallback(
    (next: boolean) => {
      if (!uid) return
      if (next) localStorage.setItem(lockStorageKey(uid), '1')
      else localStorage.removeItem(lockStorageKey(uid))
      setLocked(next)
    },
    [uid],
  )

  const lock = useCallback(() => {
    if (!hasPassword) return false
    persist(true)
    return true
  }, [hasPassword, persist])

  const release = useCallback(() => persist(false), [persist])

  const unlock = useCallback(
    async (password: string) => {
      const ok = await lockPasswordMatches(password, settings.lockSalt, settings.lockHash)
      if (ok) persist(false)
      return ok
    },
    [persist, settings.lockHash, settings.lockSalt],
  )

  const setPassword = useCallback(
    async (password: string) => {
      const lockSalt = randomLockSalt()
      const lockHash = await hashLockPassword(password, lockSalt)
      await saveSettings({ lockHash, lockSalt })
    },
    [saveSettings],
  )

  const changePassword = useCallback(
    async (current: string, next: string) => {
      const ok = await lockPasswordMatches(current, settings.lockSalt, settings.lockHash)
      if (!ok) return false
      const lockSalt = randomLockSalt()
      const lockHash = await hashLockPassword(next, lockSalt)
      await saveSettings({ lockHash, lockSalt })
      return true
    },
    [saveSettings, settings.lockHash, settings.lockSalt],
  )

  const clearPassword = useCallback(
    async (current: string) => {
      const ok = await lockPasswordMatches(current, settings.lockSalt, settings.lockHash)
      if (!ok) return false
      persist(false)
      await saveSettings({ lockHash: '', lockSalt: '' })
      return true
    },
    [persist, saveSettings, settings.lockHash, settings.lockSalt],
  )

  const value = useMemo(
    () => ({ locked, hasPassword, lock, unlock, release, setPassword, changePassword, clearPassword }),
    [changePassword, clearPassword, hasPassword, lock, locked, release, setPassword, unlock],
  )

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>
}

export function useLock() {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock must be used inside LockProvider')
  return ctx
}
