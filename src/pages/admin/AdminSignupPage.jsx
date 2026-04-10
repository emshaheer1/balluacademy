import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { useTheme } from '../../context/ThemeContext'

export default function AdminSignupPage() {
  const { adminSignUp } = useAdmin()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }
    setLoading(true)
    try {
      await adminSignUp(name.trim(), email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err?.message || 'An admin with this email already exists.')
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
        <h1>Create admin account</h1>
        <p className="admin-auth-sub">Register to access the dashboard.</p>
        <form onSubmit={handleSubmit} className="admin-auth-form">
          {error && <p className="admin-auth-error">{error}</p>}
          <div className="form-field">
            <label htmlFor="admin-name">Name</label>
            <input
              id="admin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
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
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn-primary admin-auth-btn" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="admin-auth-footer">
          Already have an account? <Link to="/admin/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
