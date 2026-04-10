import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ onClose }) {
  const { login, signUp, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' })

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageError(false)
    if (!loginForm.email?.trim()) {
      setMessage('Please enter your email.')
      setMessageError(true)
      return
    }
    if (!loginForm.password) {
      setMessage('Please enter your password.')
      setMessageError(true)
      return
    }
    setLoading(true)
    try {
      await login(loginForm.email.trim(), loginForm.password)
      onClose()
    } catch (err) {
      setMessage(err?.message || 'Sign in failed. Please try again.')
      setMessageError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setMessage('')
    setMessageError(false)
    if (!signupForm.name?.trim()) {
      setMessage('Please enter your name.')
      setMessageError(true)
      return
    }
    if (!signupForm.email?.trim()) {
      setMessage('Please enter your email.')
      setMessageError(true)
      return
    }
    if (!signupForm.password) {
      setMessage('Please enter a password.')
      setMessageError(true)
      return
    }
    if (signupForm.password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      setMessageError(true)
      return
    }
    setLoading(true)
    try {
      await signUp(signupForm.name.trim(), signupForm.email.trim(), signupForm.password)
      onClose()
    } catch (err) {
      setMessage(err?.message || 'Create account failed. Please try again.')
      setMessageError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setMessage('')
    setMessageError(false)
    setLoading(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      setMessage(err?.message || 'Google sign-in failed. Try again or use email.')
      setMessageError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop visible" onClick={onClose} aria-hidden="true" />
      <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-inner login-modal-inner">
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}><X size={20} strokeWidth={2} /></button>
          <h2 id="login-modal-title" className="login-modal-title">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn-primary btn-auth-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <button type="button" className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
              <p className="auth-switch">
                New customer?{' '}
                <button type="button" className="auth-link" onClick={() => { setMode('signup'); setMessage(''); }}>
                  Create account
                </button>
              </p>
              {message && <div className={`auth-message ${messageError ? 'error' : ''}`}>{message}</div>}
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignUp}>
              <div className="form-field">
                <label htmlFor="signup-name">Name</label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div className="form-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 6 characters"
                />
              </div>
              <button type="submit" className="btn-primary btn-auth-submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <button type="button" className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
              </button>
              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" className="auth-link" onClick={() => { setMode('login'); setMessage(''); }}>
                  Sign in
                </button>
              </p>
              {message && <div className={`auth-message ${messageError ? 'error' : ''}`}>{message}</div>}
            </form>
          )}
        </div>
      </div>
    </>
  )
}
