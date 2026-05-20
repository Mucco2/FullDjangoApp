export default function LoginForm({
  form,
  isSubmitting,
  onChange,
  onForgotPassword,
  onSubmit,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
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
        Password
        <input
          autoComplete="current-password"
          minLength="8"
          name="password"
          onChange={onChange}
          placeholder="Minimum 8 characters"
          required
          type="password"
          value={form.password}
        />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Login'}
      </button>

      <button type="button" className="link-button" onClick={onForgotPassword}>
        Forgot your password?
      </button>
    </form>
  )
}
