import { startTransition, useEffect, useEffectEvent, useState } from 'react'
import './App.css'
import {
  fetchCurrentUser,
  fetchSecret,
  loginUser,
  refreshAccessToken,
  registerUser,
} from './api'

const emptyForm = {
  username: '',
  password: '',
  confirmPassword: '',
}

const storageKey = 'login-session'

function readStoredSession() {
  const storedSession = localStorage.getItem(storageKey)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

function writeStoredSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session))
}

function clearStoredSession() {
  localStorage.removeItem(storageKey)
}

function App() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(emptyForm)
  const [session, setSession] = useState(null)
  const [secretMessage, setSecretMessage] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBooting, setIsBooting] = useState(true)

  const hydrateSession = useEffectEvent(async (storedSession) => {
    let activeAccessToken = storedSession.access

    try {
      const user = await fetchCurrentUser(activeAccessToken)
      const protectedData = await fetchSecret(activeAccessToken)

      setSession({ ...storedSession, access: activeAccessToken, user })
      setSecretMessage(protectedData.message)
      setStatus(`Welcome back, ${user.username}.`)
      return
    } catch {
      if (!storedSession.refresh) {
        throw new Error('Your session has expired. Please log in again.')
      }
    }

    const refreshedSession = await refreshAccessToken(storedSession.refresh)
    activeAccessToken = refreshedSession.access
    const user = await fetchCurrentUser(activeAccessToken)
    const protectedData = await fetchSecret(activeAccessToken)

    const nextSession = {
      ...storedSession,
      access: activeAccessToken,
      user,
    }

    writeStoredSession(nextSession)
    setSession(nextSession)
    setSecretMessage(protectedData.message)
    setStatus(`Welcome back, ${user.username}.`)
  })

  useEffect(() => {
    let isCancelled = false

    async function restoreSession() {
      const storedSession = readStoredSession()

      if (!storedSession) {
        setIsBooting(false)
        return
      }

      try {
        await hydrateSession(storedSession)
      } catch (error) {
        clearStoredSession()
        if (!isCancelled) {
          setStatus(error.message)
          setSession(null)
          setSecretMessage('')
        }
      } finally {
        if (!isCancelled) {
          setIsBooting(false)
        }
      }
    }

    restoreSession()

    return () => {
      isCancelled = true
    }
  }, [])

  const switchMode = (nextMode) => {
    startTransition(() => {
      setMode(nextMode)
      setStatus('')
      setForm(emptyForm)
    })
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const loadProtectedState = async (accessToken) => {
    const [user, protectedData] = await Promise.all([
      fetchCurrentUser(accessToken),
      fetchSecret(accessToken),
    ])

    setSession((currentSession) => ({ ...currentSession, access: accessToken, user }))
    setSecretMessage(protectedData.message)
    setStatus(`Signed in as ${user.username}.`)
    return user
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')

    try {
      if (mode === 'register') {
        await registerUser({
          username: form.username,
          password: form.password,
          confirm_password: form.confirmPassword,
        })
      }

      const tokenData = await loginUser({
        username: form.username,
        password: form.password,
      })

      const nextSession = {
        access: tokenData.access,
        refresh: tokenData.refresh,
      }

      writeStoredSession(nextSession)
      const user = await loadProtectedState(tokenData.access)

      writeStoredSession({
        ...nextSession,
        user,
      })

      setForm(emptyForm)

      if (mode === 'register') {
        setStatus(`Account created for ${user.username}. You are now signed in.`)
      }
    } catch (error) {
      setStatus(error.message)
      clearStoredSession()
      setSession(null)
      setSecretMessage('')
    } finally {
      setIsSubmitting(false)
      setIsBooting(false)
    }
  }

  const handleRefresh = async () => {
    if (!session?.refresh) {
      return
    }

    setIsSubmitting(true)
    setStatus('')

    try {
      const refreshedSession = await refreshAccessToken(session.refresh)
      const nextSession = {
        ...session,
        access: refreshedSession.access,
      }

      writeStoredSession(nextSession)
      const user = await loadProtectedState(refreshedSession.access)
      writeStoredSession({
        ...nextSession,
        user,
      })
      setStatus('Protected data refreshed.')
    } catch (error) {
      clearStoredSession()
      setSession(null)
      setSecretMessage('')
      setStatus(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    clearStoredSession()
    setSession(null)
    setSecretMessage('')
    setStatus('Session cleared.')
  }

  return (
    <main className="shell">
      <section className="auth-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Account</p>
            <h2>{session ? 'You are signed in' : 'Login or sign up'}</h2>
            {!session && (
              <p className="panel-copy">
                Create a user or log in with your existing account.
              </p>
            )}
          </div>

          {!session && (
            <div className="mode-switch" aria-label="Choose auth mode">
              <button
                className={mode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => switchMode('login')}
              >
                Login
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                type="button"
                onClick={() => switchMode('register')}
              >
                Sign up
              </button>
            </div>
          )}
        </div>

        {status && (
          <div className="status-banner" aria-live="polite">
            {status}
          </div>
        )}

        {isBooting ? (
          <div className="state-card">
            <p className="state-kicker">Session</p>
            <strong>Restoring your last login...</strong>
          </div>
        ) : session ? (
          <div className="dashboard">
            <article className="state-card">
              <p className="state-kicker">User</p>
              <strong>{session.user?.username}</strong>
              <span>You are logged in successfully.</span>
            </article>

            <article className="state-card accent">
              <p className="state-kicker">Status</p>
              <strong>{secretMessage || 'Your account is active.'}</strong>
              <span>Your login token is working.</span>
            </article>

            <div className="action-row">
              <button type="button" onClick={handleRefresh} disabled={isSubmitting}>
                {isSubmitting ? 'Refreshing...' : 'Refresh protected data'}
              </button>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                autoComplete="username"
                name="username"
                onChange={updateField}
                placeholder="John doe"
                required
                value={form.username}
              />
            </label>

            <label>
              Password
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength="8"
                name="password"
                onChange={updateField}
                placeholder="Minimum 8 characters"
                required
                type="password"
                value={form.password}
              />
            </label>

            {mode === 'register' && (
              <label>
                Confirm password
                <input
                  autoComplete="new-password"
                  minLength="8"
                  name="confirmPassword"
                  onChange={updateField}
                  placeholder="Type the same password again"
                  required
                  type="password"
                  value={form.confirmPassword}
                />
              </label>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'register'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'register'
                  ? 'Create account'
                  : 'Login'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default App
