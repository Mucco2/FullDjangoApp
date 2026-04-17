import { useState } from 'react'
import { confirmPasswordReset } from '../../api'

const emptyResetForm = {
  newPassword: '',
  confirmPassword: '',
}

const emptyNotice = {
  tone: '',
  message: '',
}

export default function ResetPasswordPage({ token, onDone }) {
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
    <main className="app-shell app-shell-centered">
      <section className="auth-card auth-card-single">
        <p className="eyebrow">Password reset</p>
        <h2>Choose a new password</h2>
        <p className="panel-copy">Enter a new password for your account.</p>

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
