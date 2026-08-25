import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getFirebase, isFirebaseConfigured } from '../lib/firebase'

type AuthContextValue = {
  configured: boolean
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const firebase = getFirebase()
    if (!firebase) {
      setLoading(false)
      return
    }
    const { auth } = firebase
    getRedirectResult(auth).catch(() => undefined)
    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      setLoading(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      user,
      loading,
      error,
      signIn: async () => {
        const firebase = getFirebase()
        if (!firebase) return
        setError(null)
        const provider = new GoogleAuthProvider()
        try {
          await signInWithPopup(firebase.auth, provider)
        } catch {
          try {
            await signInWithRedirect(firebase.auth, provider)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign-in failed')
          }
        }
      },
      logout: async () => {
        const firebase = getFirebase()
        if (!firebase) return
        await signOut(firebase.auth)
      },
    }),
    [configured, error, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
