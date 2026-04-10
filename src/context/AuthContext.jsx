import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

const AUTH_KEY = 'ballu-customer'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data?.email) return data
      }
    } catch (e) {}
    return null
  })

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem(AUTH_KEY)
      } catch (e) {}
    }
  }, [user])

  // Handle return from Google redirect sign-in
  useEffect(() => {
    let cancelled = false
    import('../firebase').then(({ auth, getRedirectResult }) => {
      return getRedirectResult(auth)
    }).then((result) => {
      if (cancelled || !result?.user) return
      return result.user.getIdToken().then((idToken) =>
        api('api/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) })
      )
    }).then((res) => {
      if (cancelled || !res?.user) return
      const u = res.user
      setUser({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Customer',
        email: u.email,
        address: u.address || {},
        avatarUrl: u.avatarUrl ?? null,
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api('api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const u = res.user
    if (!u) throw new Error('Invalid response')
    const userData = {
      id: u.id,
      name: u.name || email?.split('@')[0] || 'Customer',
      email: u.email,
      address: u.address || {},
      avatarUrl: u.avatarUrl ?? null,
    }
    setUser(userData)
  }, [])

  const signUp = useCallback(async (name, email, password) => {
    const res = await api('api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    const u = res.user
    if (!u) throw new Error('Invalid response')
    const userData = {
      id: u.id,
      name: u.name || name || email?.split('@')[0] || 'Customer',
      email: u.email,
      address: u.address || {},
      avatarUrl: u.avatarUrl ?? null,
    }
    setUser(userData)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const { auth, googleProvider, signInWithPopup, signInWithRedirect } = await import('../firebase')
    let result
    try {
      result = await signInWithPopup(auth, googleProvider)
    } catch (popupErr) {
      const code = popupErr?.code || ''
      if (code === 'auth/network-request-failed' || code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider)
        throw new Error('Sign-in opened in a new tab. Complete sign-in there, then you’ll return here.')
      }
      throw popupErr
    }
    const idToken = await result.user.getIdToken()
    const res = await api('api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
    const u = res.user
    if (!u) throw new Error('Invalid response')
    const userData = {
      id: u.id,
      name: u.name || u.email?.split('@')[0] || 'Customer',
      email: u.email,
      address: u.address || {},
      avatarUrl: u.avatarUrl ?? null,
    }
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem('feliciaCart')
      localStorage.removeItem('ballu-favourites')
    } catch (e) {}
  }, [])

  const updateAddress = useCallback(async (updates) => {
    if (!user?.email) return
    const res = await api('api/customers/profile', {
      method: 'PATCH',
      body: JSON.stringify({ email: user.email, address: updates }),
    })
    if (res.user) setUser((prev) => (prev ? { ...prev, address: res.user.address || {} } : null))
  }, [user?.email])

  const updateProfile = useCallback(async (updates) => {
    if (!user?.email) return
    const res = await api('api/customers/profile', {
      method: 'PATCH',
      body: JSON.stringify({ email: user.email, ...updates }),
    })
    if (res.user) setUser((prev) => (prev ? { ...prev, ...res.user } : null))
  }, [user?.email])

  return (
    <AuthContext.Provider value={{ user, login, signUp, loginWithGoogle, logout, updateAddress, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
