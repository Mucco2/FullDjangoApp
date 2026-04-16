import { startTransition, useEffect, useEffectEvent, useState } from 'react'
import './App.css'
import {
  changePassword,
  deleteAccount,
  fetchCurrentUser,
  fetchSecret,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateUsername,
} from './api'

const emptyForm = {
  username: '',
  password: '',
  confirmPassword: '',
}

const emptyUsernameForm = {
  username: '',
}

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const emptyNotice = {
  tone: '',
  message: '',
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
  const [usernameForm, setUsernameForm] = useState(emptyUsernameForm)
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [usernameNotice, setUsernameNotice] = useState(emptyNotice)
  const [passwordNotice, setPasswordNotice] = useState(emptyNotice)

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

  useEffect(() => {
    if (!session?.user?.username) {
      setUsernameForm(emptyUsernameForm)
      setUsernameNotice(emptyNotice)
      setPasswordNotice(emptyNotice)
      return
    }

    setUsernameForm({ username: session.user.username })
  }, [session?.user?.username])

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

  const updateUsernameField = (event) => {
    const { name, value } = event.target
    setUsernameForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const updatePasswordField = (event) => {
    const { name, value } = event.target
    setPasswordForm((currentForm) => ({ ...currentForm, [name]: value }))
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

  const handleDeleteAccount = async () => {
    if (!session?.access || isDeletingAccount) {
      return
    }

    const shouldDelete = window.confirm(
      'Delete your account permanently? This cannot be undone.'
    )

    if (!shouldDelete) {
      return
    }

    setIsDeletingAccount(true)
    setStatus('')
    setUsernameNotice(emptyNotice)
    setPasswordNotice(emptyNotice)

    try {
      const response = await deleteAccount(session.access)
      clearStoredSession()
      setSession(null)
      setSecretMessage('')
      setPasswordForm(emptyPasswordForm)
      setUsernameForm(emptyUsernameForm)
      setStatus(response.message)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleUsernameUpdate = async (event) => {
    event.preventDefault()

    if (!session?.access) {
      return
    }

    setIsUpdatingUsername(true)
    setStatus('')
    setUsernameNotice(emptyNotice)

    try {
      const response = await updateUsername(session.access, {
        username: usernameForm.username,
      })
      const nextSession = {
        ...session,
        user: response.user,
      }

      setSession(nextSession)
      writeStoredSession(nextSession)
      setStatus(response.message)
      setUsernameNotice({ tone: 'success', message: response.message })
    } catch (error) {
      setStatus(error.message)
      setUsernameNotice({ tone: 'error', message: error.message })
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()

    if (!session?.access) {
      return
    }

    setIsUpdatingPassword(true)
    setStatus('')
    setPasswordNotice(emptyNotice)

    try {
      const response = await changePassword(session.access, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      })

      setPasswordForm(emptyPasswordForm)
      setStatus(response.message)
      setPasswordNotice({ tone: 'success', message: response.message })
    } catch (error) {
      setStatus(error.message)
      setPasswordNotice({ tone: 'error', message: error.message })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <main className={`shell${session ? ' shell-authenticated' : ''}`}>
      <section className={`auth-panel${session ? ' auth-panel-authenticated' : ''}`}>
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

            <div className="settings-grid">
              <form className="state-card settings-form" onSubmit={handleUsernameUpdate}>
                <p className="state-kicker">Username</p>
                <strong>Change your username</strong>
                <label>
                  New username
                  <input
                    autoComplete="username"
                    name="username"
                    onChange={updateUsernameField}
                    required
                    value={usernameForm.username}
                  />
                </label>
                <button type="submit" disabled={isUpdatingUsername}>
                  {isUpdatingUsername ? 'Saving username...' : 'Save username'}
                </button>
                {usernameNotice.message && (
                  <p className={`form-notice ${usernameNotice.tone}`}>
                    {usernameNotice.message}
                  </p>
                )}
              </form>

              <form className="state-card settings-form" onSubmit={handlePasswordUpdate}>
                <p className="state-kicker">Password</p>
                <strong>Change your password</strong>
                <label>
                  Current password
                  <input
                    autoComplete="current-password"
                    name="currentPassword"
                    onChange={updatePasswordField}
                    required
                    type="password"
                    value={passwordForm.currentPassword}
                  />
                </label>
                <label>
                  New password
                  <input
                    autoComplete="new-password"
                    minLength="8"
                    name="newPassword"
                    onChange={updatePasswordField}
                    required
                    type="password"
                    value={passwordForm.newPassword}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    autoComplete="new-password"
                    minLength="8"
                    name="confirmPassword"
                    onChange={updatePasswordField}
                    required
                    type="password"
                    value={passwordForm.confirmPassword}
                  />
                </label>
                <button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Saving password...' : 'Save password'}
                </button>
                {passwordNotice.message && (
                  <p className={`form-notice ${passwordNotice.tone}`}>
                    {passwordNotice.message}
                  </p>
                )}
              </form>
            </div>

            <div className="action-row">
              <button type="button" className="danger-button logout-button" onClick={handleLogout}>
                Log out
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={isDeletingAccount}
                onClick={handleDeleteAccount}
              >
                {isDeletingAccount ? 'Deleting account...' : 'Delete account'}
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
