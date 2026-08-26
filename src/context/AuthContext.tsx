import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getFirebase, isFirebaseConfigured } from '../lib/firebase'
import { clearAllLockFlags } from '../lib/lock'

type AuthContextValue = {
  configured: boolean
  user: User | null
  loading: boolean
  busy: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  updateName: (name: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function errorMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/invalid-email':
        return 'Enter a valid email address.'
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email or password is incorrect.'
      case 'auth/email-already-in-use':
        return 'That email already has an account. Sign in instead.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled in the Firebase console.'
      default:
        return err.message
    }
  }
  return err instanceof Error ? err.message : 'Sign-in failed'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const firebase = getFirebase()
    if (!firebase) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(firebase.auth, (next) => {
      setUser(next)
      setLoading(false)
    })
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const signIn = useCallback(async (email: string, password: string) => {
    const firebase = getFirebase()
    if (!firebase) return
    setError(null)
    setBusy(true)
    try {
      await signInWithEmailAndPassword(firebase.auth, email, password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const firebase = getFirebase()
    if (!firebase) return
    setError(null)
    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(firebase.auth, email, password)
      const displayName = name?.trim()
      if (displayName) {
        try {
          await updateProfile(cred.user, { displayName })
          setUser(firebase.auth.currentUser)
        } catch {
          /* Account exists; name can be set later on Profile. */
        }
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }, [])

  const updateName = useCallback(async (name: string) => {
    const firebase = getFirebase()
    if (!firebase?.auth.currentUser) return
    await updateProfile(firebase.auth.currentUser, { displayName: name.trim() })
    setUser(firebase.auth.currentUser)
  }, [])

  const logout = useCallback(async () => {
    const firebase = getFirebase()
    if (!firebase) return
    clearAllLockFlags()
    await signOut(firebase.auth)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      user,
      loading,
      busy,
      error,
      signIn,
      register,
      updateName,
      logout,
      clearError,
    }),
    [busy, clearError, configured, error, loading, logout, register, signIn, updateName, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
