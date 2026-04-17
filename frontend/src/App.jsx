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
  requestPasswordReset,
  updateProfile,
  updateUsername,
} from './api'
import AccountDashboard from './components/account/AccountDashboard'
import AuthShell from './components/auth/AuthShell'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import VerifyEmailPage from './components/auth/VerifyEmailPage'

const emptyLoginForm = {
  username: '',
  password: '',
}

const emptyRegisterForm = {
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

const emptyNotice = {
  tone: '',
  message: '',
}

const storageKey = 'login-session'
const bootRefreshKey = 'boot-refresh-attempted'

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
    return (
      <ResetPasswordPage
        token={route.token}
        onDone={() => {
          navigateHome()
          setRoute({ name: 'default' })
        }}
      />
    )
  }

  if (route.name === 'verify') {
    return (
      <VerifyEmailPage
        token={route.token}
        onDone={() => {
          navigateHome()
          setRoute({ name: 'default' })
        }}
      />
    )
  }

  return <MainApp />
}

function MainApp() {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(emptyLoginForm)
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm)
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
      const user = await loadProtectedState(activeAccessToken)
      setStatus(`Welcome back, ${user.username}.`)
      setSession({ ...storedSession, access: activeAccessToken, user })
      return
    } catch {
      if (!storedSession.refresh) {
        throw new Error('Your session has expired. Please log in again.')
      }
    }

    const refreshedSession = await refreshAccessToken(storedSession.refresh)
    activeAccessToken = refreshedSession.access
    const user = await loadProtectedState(activeAccessToken)

    const nextSession = {
      ...storedSession,
      access: activeAccessToken,
      user,
    }

    writeStoredSession(nextSession)
    setSession(nextSession)
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
  }, [hydrateSession])

  useEffect(() => {
    if (!isBooting) {
      sessionStorage.removeItem(bootRefreshKey)
      return
    }

    const refreshTimeout = window.setTimeout(() => {
      if (sessionStorage.getItem(bootRefreshKey) === 'true') {
        return
      }

      sessionStorage.setItem(bootRefreshKey, 'true')
      window.location.reload()
    }, 5000)

    return () => {
      window.clearTimeout(refreshTimeout)
    }
  }, [isBooting])

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
      setLoginForm(emptyLoginForm)
      setRegisterForm(emptyRegisterForm)
      setForgotEmail('')
    })
  }

  const updateLoginField = (event) => {
    const { name, value } = event.target
    setLoginForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const updateRegisterField = (event) => {
    const { name, value } = event.target
    setRegisterForm((currentForm) => ({ ...currentForm, [name]: value }))
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
    return user
  }

  const completeLogin = async (tokenData, successMessage) => {
    const nextSession = {
      access: tokenData.access,
      refresh: tokenData.refresh,
    }

    writeStoredSession(nextSession)

    const user = await loadProtectedState(tokenData.access)
    const hydratedSession = {
      ...nextSession,
      user,
    }

    writeStoredSession(hydratedSession)
    setSession(hydratedSession)
    setStatus(successMessage(user))
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')

    try {
      const tokenData = await loginUser(loginForm)
      await completeLogin(tokenData, (user) => `Signed in as ${user.username}.`)
      setLoginForm(emptyLoginForm)
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

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')

    try {
      await registerUser({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        confirm_password: registerForm.confirmPassword,
      })

      const tokenData = await loginUser({
        username: registerForm.username,
        password: registerForm.password,
      })

      await completeLogin(
        tokenData,
        (user) => `Account created for ${user.username}. Check your email to verify your address.`
      )
      setRegisterForm(emptyRegisterForm)
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

  if (isBooting) {
    return (
      <main className="app-shell app-shell-centered">
        <section className="auth-card auth-card-single">
          <p className="eyebrow">Session</p>
          <h2>Restoring your last login</h2>
          <p className="panel-copy">
            We are checking whether your saved session is still active.
          </p>
          <div className="state-card">
            <strong>Loading account details...</strong>
          </div>
        </section>
      </main>
    )
  }

  if (session) {
    return (
      <AccountDashboard
        isDeletingAccount={isDeletingAccount}
        isUpdatingPassword={isUpdatingPassword}
        isUpdatingProfile={isUpdatingProfile}
        isUpdatingUsername={isUpdatingUsername}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
        onPasswordFieldChange={updatePasswordField}
        onPasswordSubmit={handlePasswordUpdate}
        onProfileFieldChange={updateProfileField}
        onProfileSubmit={handleProfileUpdate}
        onUsernameFieldChange={updateUsernameField}
        onUsernameSubmit={handleUsernameUpdate}
        passwordForm={passwordForm}
        passwordNotice={passwordNotice}
        profileForm={profileForm}
        profileNotice={profileNotice}
        secretMessage={secretMessage}
        session={session}
        status={status}
        usernameForm={usernameForm}
        usernameNotice={usernameNotice}
      />
    )
  }

  return (
    <AuthShell mode={mode} onModeChange={switchMode} status={status}>
      {mode === 'login' && (
        <LoginForm
          form={loginForm}
          isSubmitting={isSubmitting}
          onChange={updateLoginField}
          onForgotPassword={() => switchMode('forgot')}
          onSubmit={handleLoginSubmit}
        />
      )}

      {mode === 'register' && (
        <RegisterForm
          form={registerForm}
          isSubmitting={isSubmitting}
          onChange={updateRegisterField}
          onSubmit={handleRegisterSubmit}
        />
      )}

      {mode === 'forgot' && (
        <ForgotPasswordForm
          email={forgotEmail}
          isSubmitting={isSubmitting}
          onChange={setForgotEmail}
          onSubmit={handleForgotSubmit}
        />
      )}
    </AuthShell>
  )
}

export default App
