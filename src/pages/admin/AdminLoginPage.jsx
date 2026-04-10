import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { useTheme } from '../../context/ThemeContext'

export default function AdminLoginPage() {
  const { adminLogin } = useAdmin()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter email and password.')
      return
    }
    setLoading(true)
    try {
      await adminLogin(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-auth-page">
      <button type="button" className="admin-theme-toggle" aria-label="Toggle dark mode" onClick={toggle} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
        {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
      </button>
      <div className="admin-auth-card">
        <h1>Admin sign in</h1>
        <p className="admin-auth-sub">Sign in to access the dashboard.</p>
        <form onSubmit={handleSubmit} className="admin-auth-form">
          {error && <p className="admin-auth-error">{error}</p>}
          <div className="form-field">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary admin-auth-btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="admin-auth-footer">
          Don’t have an account? <Link to="/admin/signup">Create one</Link>
        </p>
      </div>
    </div>
  )
}
