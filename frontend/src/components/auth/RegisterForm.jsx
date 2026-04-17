export default function RegisterForm({ form, isSubmitting, onChange, onSubmit }) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="form-intro-card">
        <p className="state-kicker">New here?</p>
        <strong>Create your account and start in a cleaner flow.</strong>
        <span>You will be signed in right after registration completes.</span>
      </div>

      <label>
        Username
        <input
          autoComplete="username"
          name="username"
          onChange={onChange}
          placeholder="john_doe"
          required
          value={form.username}
        />
      </label>

      <label>
        Email
        <input
          autoComplete="email"
          name="email"
          onChange={onChange}
          placeholder="you@example.com"
          required
          type="email"
          value={form.email}
        />
      </label>

      <label>
        Password
        <input
          autoComplete="new-password"
          minLength="8"
          name="password"
          onChange={onChange}
          placeholder="Minimum 8 characters"
          required
          type="password"
          value={form.password}
        />
      </label>

      <label>
        Confirm password
        <input
          autoComplete="new-password"
          minLength="8"
          name="confirmPassword"
          onChange={onChange}
          placeholder="Type the same password again"
          required
          type="password"
          value={form.confirmPassword}
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  )
}
