const copyByMode = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Log in to your account',
    description: 'Access your dashboard, profile tools, and protected routes in one place.',
  },
  register: {
    eyebrow: 'Create account',
    title: 'Register in a dedicated form',
    description: 'New users get their own screen now, so the auth code stays much easier to manage.',
  },
  forgot: {
    eyebrow: 'Password reset',
    title: 'Request a reset link',
    description: 'Enter your email address and we will send you a password reset link if the account exists.',
  },
}

export default function AuthShell({ mode, onModeChange, status, children }) {
  const activeCopy = copyByMode[mode]

  return (
    <main className="app-shell app-shell-centered">
      <section className="auth-stage">
        <section className="auth-card auth-card-focus">
          <div className="auth-card-header">
            <div>
              <p className="eyebrow">{activeCopy.eyebrow}</p>
              <h2>{activeCopy.title}</h2>
              <p className="panel-copy">{activeCopy.description}</p>
            </div>

            {mode !== 'forgot' && (
              <div className="mode-switch" aria-label="Choose auth mode">
                <button
                  className={mode === 'login' ? 'active' : ''}
                  type="button"
                  onClick={() => onModeChange('login')}
                >
                  Login
                </button>
                <button
                  className={mode === 'register' ? 'active' : ''}
                  type="button"
                  onClick={() => onModeChange('register')}
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {mode === 'forgot' && (
            <button
              type="button"
              className="link-button mode-link"
              onClick={() => onModeChange('login')}
            >
              Back to login
            </button>
          )}

          {status && (
            <div className="status-banner" aria-live="polite">
              {status}
            </div>
          )}

          {children}
        </section>
      </section>
    </main>
  )
}
