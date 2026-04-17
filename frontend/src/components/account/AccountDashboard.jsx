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

export default function AccountDashboard({
  isDeletingAccount,
  isUpdatingPassword,
  isUpdatingProfile,
  isUpdatingUsername,
  onDeleteAccount,
  onLogout,
  onPasswordFieldChange,
  onPasswordSubmit,
  onProfileFieldChange,
  onProfileSubmit,
  onUsernameFieldChange,
  onUsernameSubmit,
  passwordForm,
  passwordNotice,
  profileForm,
  profileNotice,
  secretMessage,
  session,
  status,
  usernameForm,
  usernameNotice,
}) {
  const emailVerified = session?.user?.profile?.email_verified
  const headerAvatar = session?.user?.profile?.avatar_url
  const usernameInitial = session?.user?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <main className="app-shell dashboard-shell">
      <section className="dashboard-panel">
        <div className="dashboard-header">
          <div className="dashboard-copy">
            <p className="eyebrow">Account dashboard</p>
            <h1>{session.user?.username}</h1>
            <p className="panel-copy">
              Manage your account details, password, and public profile from one place.
            </p>
          </div>

          <article className="user-card">
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
              <span>{session.user?.email}</span>
              <span>
                Email status:{' '}
                {emailVerified ? (
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Check your inbox</span>
                )}
              </span>
            </div>
          </article>
        </div>

        {status && (
          <div className="status-banner" aria-live="polite">
            {status}
          </div>
        )}

        <div className="dashboard-highlights">
          <article className="state-card accent">
            <p className="state-kicker">Session</p>
            <strong>{secretMessage || 'Your account is active.'}</strong>
            <span>Your access token is working correctly.</span>
          </article>

          <article className="state-card">
            <p className="state-kicker">Profile snapshot</p>
            <strong>{session.user?.profile?.industry_display || 'No industry selected yet'}</strong>
            <span>{session.user?.profile?.bio || 'Add a short bio so your profile feels complete.'}</span>
          </article>
        </div>

        <div className="settings-grid">
          <form className="state-card settings-form" onSubmit={onUsernameSubmit}>
            <p className="state-kicker">Username</p>
            <strong>Change your username</strong>
            <label>
              New username
              <input
                autoComplete="username"
                name="username"
                onChange={onUsernameFieldChange}
                required
                value={usernameForm.username}
              />
            </label>
            <button type="submit" disabled={isUpdatingUsername}>
              {isUpdatingUsername ? 'Saving username...' : 'Save username'}
            </button>
            {usernameNotice.message && (
              <p className={`form-notice ${usernameNotice.tone}`}>{usernameNotice.message}</p>
            )}
          </form>

          <form className="state-card settings-form" onSubmit={onPasswordSubmit}>
            <p className="state-kicker">Password</p>
            <strong>Update your password</strong>
            <label>
              Current password
              <input
                autoComplete="current-password"
                name="currentPassword"
                onChange={onPasswordFieldChange}
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
                onChange={onPasswordFieldChange}
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
                onChange={onPasswordFieldChange}
                required
                type="password"
                value={passwordForm.confirmPassword}
              />
            </label>
            <button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Saving password...' : 'Save password'}
            </button>
            {passwordNotice.message && (
              <p className={`form-notice ${passwordNotice.tone}`}>{passwordNotice.message}</p>
            )}
          </form>

          <form className="state-card settings-form settings-form-wide" onSubmit={onProfileSubmit}>
            <p className="state-kicker">Profile</p>
            <strong>Edit your public profile</strong>
            <label>
              Bio
              <input
                name="bio"
                onChange={onProfileFieldChange}
                placeholder="A short bio about you"
                value={profileForm.bio}
              />
            </label>
            <label>
              Avatar URL
              <input
                name="avatar_url"
                onChange={onProfileFieldChange}
                placeholder="https://..."
                type="url"
                value={profileForm.avatar_url}
              />
            </label>
            <label>
              Industry
              <select
                name="industry"
                onChange={onProfileFieldChange}
                value={profileForm.industry}
              >
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              <p className={`form-notice ${profileNotice.tone}`}>{profileNotice.message}</p>
            )}
          </form>
        </div>

        <div className="action-row">
          <button type="button" className="secondary-button" onClick={onLogout}>
            Log out
          </button>
          <button
            type="button"
            className="danger-button"
            disabled={isDeletingAccount}
            onClick={onDeleteAccount}
          >
            {isDeletingAccount ? 'Deleting account...' : 'Delete account'}
          </button>
        </div>
      </section>
    </main>
  )
}
