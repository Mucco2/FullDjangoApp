import { useState } from 'react'
import {
  adminLogin,
  clearAdminSession,
  writeAdminSession,
} from '../../adminApi'

const emptyForm = {
  username: '',
  password: '',
}

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('')

    try {
      const tokenData = await adminLogin(form)
      const session = {
        access: tokenData.access,
        refresh: tokenData.refresh,
        user: tokenData.user,
      }

      writeAdminSession(session)
      setForm(emptyForm)
      onLogin(session)
    } catch (error) {
      clearAdminSession()
      setStatus(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell app-shell-centered">
      <section className="auth-card auth-card-single admin-login-card">
        <div className="auth-card-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Sign in</h2>
            <p className="panel-copy">
              Staff and superuser accounts can manage users here.
            </p>
          </div>
        </div>

        {status && (
          <div className="status-banner status-banner-error" aria-live="polite">
            {status}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              name="username"
              onChange={updateField}
              required
              value={form.username}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={updateField}
              required
              type="password"
              value={form.password}
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      </section>
    </main>
  )
}
