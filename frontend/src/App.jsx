import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'
import './App.css'
import {
  changePassword,
  confirmPasswordReset,
  deleteAccount,
  fetchCurrentUser,
  fetchSecret,
  loginUser,
  refreshAccessToken,
  registerUser,
  requestPasswordReset,
  updateProfile,
  updateUsername,
  verifyEmail,
} from './api'

const emptyForm = {
  username: '',
  email: '',
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

const emptyProfileForm = {
  bio: '',
  avatar_url: '',
  industry: '',
}

const industryOptions = [
  { value: '', label: 'Not specified' },
  { value: 'tech', label: 'Technology / IT' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'construction', label: 'Construction' },
  { value: 'hospitality', label: 'Hospitality / Travel' },
  { value: 'media', label: 'Media / Entertainment' },
  { value: 'government', label: 'Government / Public sector' },
  { value: 'nonprofit', label: 'Non-profit' },
  { value: 'other', label: 'Other' },
]

const emptyResetForm = {
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

// Detect the current route from the URL.
// Returns { name: 'reset' | 'verify' | 'default', token?: string }
function detectRoute() {
  const path = window.location.pathname
  const resetMatch = path.match(/^\/reset-password\/([^/]+)\/?$/)
  if (resetMatch) {
    return { name: 'reset', token: resetMatch[1] }
  }
  const verifyMatch = path.match(/^\/verify-email\/([^/]+)\/?$/)
  if (verifyMatch) {
    return { name: 'verify', token: verifyMatch[1] }
  }
  return { name: 'default' }
}

function navigateHome() {
  window.history.replaceState({}, '', '/')
}

function App() {
  const [route, setRoute] = useState(detectRoute)

  if (route.name === 'reset') {
    return <ResetPasswordPage token={route.token} onDone={() => {
      navigateHome()
      setRoute({ name: 'default' })
    }} />
  }

  if (route.name === 'verify') {
    return <VerifyEmailPage token={route.token} onDone={() => {
      navigateHome()
      setRoute({ name: 'default' })
    }} />
  }

  return <MainApp />
}

function VerifyEmailPage({ token, onDone }) {
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email address...')
  const hasVerified = useRef(false)

  useEffect(() => {
    // Guard against React StrictMode firing this effect twice in dev —
    // the token is single-use, so the second call would hit a deleted record.
    if (hasVerified.current) return
    hasVerified.current = true

    verifyEmail(token)
      .then((response) => {
        setStatus('success')
        setMessage(response.message || 'Email verified.')
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error.message)
      })
  }, [token])

  return (
    <main className="shell">
      <section className="auth-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Email verification</p>
            <h2>
              {status === 'verifying' && 'Verifying...'}
              {status === 'success' && 'Email verified'}
              {status === 'error' && 'Verification failed'}
            </h2>
            <p className="panel-copy">{message}</p>
          </div>
        </div>
        {status !== 'verifying' && (
          <div className="action-row">
            <button type="button" onClick={onDone}>
              Go to login
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function ResetPasswordPage({ token, onDone }) {
  const [form, setForm] = useState(emptyResetForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(emptyNotice)
  const [done, setDone] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setNotice(emptyNotice)

    try {
      const response = await confirmPasswordReset({
        token,
        new_password: form.newPassword,
        confirm_password: form.confirmPassword,
      })
      setNotice({ tone: 'success', message: response.message })
      setDone(true)
    } catch (error) {
      setNotice({ tone: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="shell">
      <section className="auth-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Password reset</p>
            <h2>Choose a new password</h2>
            <p className="panel-copy">
              Enter a new password for your account.
            </p>
          </div>
        </div>

        {notice.message && (
          <div className={`form-notice ${notice.tone}`}>{notice.message}</div>
        )}

        {!done ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              New password
              <input
                autoComplete="new-password"
                minLength="8"
                name="newPassword"
                onChange={updateField}
                placeholder="Minimum 8 characters"
                required
                type="password"
                value={form.newPassword}
              />
            </label>
            <label>
              Confirm new password
              <input
                autoComplete="new-password"
                minLength="8"
                name="confirmPassword"
                onChange={updateField}
                required
                type="password"
                value={form.confirmPassword}
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Reset password'}
            </button>
          </form>
        ) : (
          <div className="action-row">
            <button type="button" onClick={onDone}>
              Go to login
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function MainApp() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [form, setForm] = useState(emptyForm)
  const [forgotEmail, setForgotEmail] = useState('')
  const [session, setSession] = useState(null)
  const [secretMessage, setSecretMessage] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [usernameForm, setUsernameForm] = useState(emptyUsernameForm)
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [profileForm, setProfileForm] = useState(emptyProfileForm)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [usernameNotice, setUsernameNotice] = useState(emptyNotice)
  const [passwordNotice, setPasswordNotice] = useState(emptyNotice)
  const [profileNotice, setProfileNotice] = useState(emptyNotice)

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
      setProfileForm(emptyProfileForm)
      setUsernameNotice(emptyNotice)
      setPasswordNotice(emptyNotice)
      setProfileNotice(emptyNotice)
      return
    }

    setUsernameForm({ username: session.user.username })
    setProfileForm({
      bio: session.user.profile?.bio ?? '',
      avatar_url: session.user.profile?.avatar_url ?? '',
      industry: session.user.profile?.industry ?? '',
    })
  }, [
    session?.user?.username,
    session?.user?.profile?.bio,
    session?.user?.profile?.avatar_url,
    session?.user?.profile?.industry,
  ])

  const switchMode = (nextMode) => {
    startTransition(() => {
      setMode(nextMode)
      setStatus('')
      setForm(emptyForm)
      setForgotEmail('')
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

  const updateProfileField = (event) => {
    const { name, value } = event.target
    setProfileForm((currentForm) => ({ ...currentForm, [name]: value }))
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
          email: form.email,
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
        setStatus(`Account created for ${user.username}. Check your email to verify your address.`)
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

  const handleForgotSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')

    try {
      const response = await requestPasswordReset(forgotEmail)
      setStatus(response.message)
      setForgotEmail('')
    } catch (error) {
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
      setProfileForm(emptyProfileForm)
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

  const handleProfileUpdate = async (event) => {
    event.preventDefault()

    if (!session?.access) {
      return
    }

    setIsUpdatingProfile(true)
    setStatus('')
    setProfileNotice(emptyNotice)

    try {
      const response = await updateProfile(session.access, {
        bio: profileForm.bio,
        avatar_url: profileForm.avatar_url,
        industry: profileForm.industry,
      })
      const nextSession = {
        ...session,
        user: response.user,
      }

      setSession(nextSession)
      writeStoredSession(nextSession)
      setStatus(response.message)
      setProfileNotice({ tone: 'success', message: response.message })
    } catch (error) {
      setStatus(error.message)
      setProfileNotice({ tone: 'error', message: error.message })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const emailVerified = session?.user?.profile?.email_verified
  const headerAvatar = session?.user?.profile?.avatar_url
  const usernameInitial = session?.user?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <main className={`shell${session ? ' shell-authenticated' : ''}`}>
      <section className={`auth-panel${session ? ' auth-panel-authenticated' : ''}`}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Account</p>
            <h2>
              {session
                ? 'You are signed in'
                : mode === 'forgot'
                  ? 'Reset your password'
                  : 'Login or sign up'}
            </h2>
            {!session && mode !== 'forgot' && (
              <p className="panel-copy">
                Create a user or log in with your existing account.
              </p>
            )}
            {!session && mode === 'forgot' && (
              <p className="panel-copy">
                Enter your email address and we'll send you a reset link.
              </p>
            )}
          </div>

          {!session && mode !== 'forgot' && (
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
            <article className="state-card user-card">
              <div className="user-card-avatar">
                {headerAvatar ? (
                  <img
                    src={headerAvatar}
                    alt={`${session.user?.username} avatar`}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="avatar-fallback">{usernameInitial}</span>
                )}
              </div>
              <div className="user-card-info">
                <p className="state-kicker">User</p>
                <strong>{session.user?.username}</strong>
                <span>{session.user?.email}</span>
                <span>
                  Email:{' '}
                  {emailVerified ? (
                    <span className="badge badge-success">Verified</span>
                  ) : (
                    <span className="badge badge-warning">Not verified — check your inbox</span>
                  )}
                </span>
              </div>
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

              <form className="state-card settings-form" onSubmit={handleProfileUpdate}>
                <p className="state-kicker">Profile</p>
                <strong>Edit your profile</strong>
                <label>
                  Bio
                  <input
                    name="bio"
                    onChange={updateProfileField}
                    placeholder="A short bio about you"
                    value={profileForm.bio}
                  />
                </label>
                <label>
                  Avatar URL
                  <input
                    name="avatar_url"
                    onChange={updateProfileField}
                    placeholder="https://..."
                    type="url"
                    value={profileForm.avatar_url}
                  />
                </label>
                {profileForm.avatar_url && (
                  <img
                    src={profileForm.avatar_url}
                    alt="Avatar preview"
                    className="avatar-preview"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving profile...' : 'Save profile'}
                </button>
                {profileNotice.message && (
                  <p className={`form-notice ${profileNotice.tone}`}>
                    {profileNotice.message}
                  </p>
                )}
              </form>

              <form className="state-card settings-form" onSubmit={handleProfileUpdate}>
                <p className="state-kicker">Industry</p>
                <strong>Your work industry</strong>
                <label>
                  Select your industry
                  <select
                    name="industry"
                    onChange={updateProfileField}
                    value={profileForm.industry}
                  >
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {session.user?.profile?.industry_display && profileForm.industry && (
                  <span>
                    Currently listed as:{' '}
                    <strong>{session.user.profile.industry_display}</strong>
                  </span>
                )}
                <button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving industry...' : 'Save industry'}
                </button>
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
        ) : mode === 'forgot' ? (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <label>
              Email
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={forgotEmail}
              />
            </label>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => switchMode('login')}
            >
              Back to login
            </button>
          </form>
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

            {mode === 'register' && (
              <label>
                Email
                <input
                  autoComplete="email"
                  name="email"
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={form.email}
                />
              </label>
            )}

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

            {mode === 'login' && (
              <button
                type="button"
                className="link-button"
                onClick={() => switchMode('forgot')}
              >
                Forgot your password?
              </button>
            )}
          </form>
        )}
      </section>
    </main>
  )
}

export default App
