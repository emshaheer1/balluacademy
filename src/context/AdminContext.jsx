import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const ADMIN_KEY = 'ballu-admin'
const ADMIN_TOKEN_KEY = 'ballu-admin-token'
const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem(ADMIN_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data?.email) return data
      }
    } catch (e) {}
    return null
  })

  useEffect(() => {
    if (admin) {
      try {
        localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
      } catch (e) {}
    } else {
      try {
        localStorage.removeItem(ADMIN_KEY)
        localStorage.removeItem(ADMIN_TOKEN_KEY)
      } catch (e) {}
    }
  }, [admin])

  const adminLogin = async (email, password) => {
    const res = await api('api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (!res.admin || !res.token) throw new Error(res.error || 'Login failed')
    localStorage.setItem(ADMIN_TOKEN_KEY, res.token)
    setAdmin(res.admin)
    return true
  }

  const adminSignUp = async (name, email, password) => {
    const res = await api('api/admin/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.admin || !res.token) throw new Error(res.error || 'Sign up failed')
    localStorage.setItem(ADMIN_TOKEN_KEY, res.token)
    setAdmin(res.admin)
    return true
  }

  const adminLogout = () => {
    setAdmin(null)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  }

  return (
    <AdminContext.Provider value={{ admin, adminLogin, adminSignUp, adminLogout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
