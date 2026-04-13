'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, User as FirebaseUser,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUser, createUser } from '@/lib/db'
import type { User } from '@/types'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, vertical: string) => Promise<void>
  logOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUser(fbUser: FirebaseUser) {
    const u = await getUser(fbUser.uid)
    setUser(u)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fbUser => {
      setFirebaseUser(fbUser)
      if (fbUser) {
        await loadUser(fbUser)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUp(email: string, password: string, name: string, vertical: string) {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password)
    await createUser(fbUser.uid, {
      email,
      name,
      role: 'user',
      plan: 'free',
      vertical,
      facebookConnected: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await loadUser(fbUser)
  }

  async function logOut() {
    await signOut(auth)
    setUser(null)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function refreshUser() {
    if (firebaseUser) await loadUser(firebaseUser)
  }

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, signIn, signUp, logOut, resetPassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
