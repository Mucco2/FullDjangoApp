import { useEffect, useRef, useState } from 'react'
import { verifyEmail } from '../../api'

export default function VerifyEmailPage({ token, onDone }) {
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email address...')
  const hasVerified = useRef(false)

  useEffect(() => {
    if (hasVerified.current) {
      return
    }

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
    <main className="app-shell app-shell-centered">
      <section className="auth-card auth-card-single">
        <p className="eyebrow">Email verification</p>
        <h2>
          {status === 'verifying' && 'Verifying...'}
          {status === 'success' && 'Email verified'}
          {status === 'error' && 'Verification failed'}
        </h2>
        <p className="panel-copy">{message}</p>

        {status !== 'verifying' && (
          <div className="action-row">
            <button type="button" onClick={onDone}>
              You can now close this page and return to the app.
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
