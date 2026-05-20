export default function ForgotPasswordForm({
  email,
  isSubmitting,
  onChange,
  onSubmit,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="form-intro-card">
        <p className="state-kicker">Reset access</p>
        <strong>We will email you a reset link.</strong>
        <span>The message will only be sent if an account exists for that email.</span>
      </div>

      <label>
        Email
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => onChange(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  )
}
