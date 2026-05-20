import { useEffect, useState } from 'react'

const editableFields = [
  'username',
  'email',
  'first_name',
  'last_name',
  'is_active',
  'is_staff',
  'is_superuser',
]

function createForm(user) {
  return {
    username: user?.username ?? '',
    email: user?.email ?? '',
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    is_active: Boolean(user?.is_active),
    is_staff: Boolean(user?.is_staff),
    is_superuser: Boolean(user?.is_superuser),
  }
}

export default function EditUserModal({
  currentAdmin,
  isSaving,
  onClose,
  onSave,
  user,
}) {
  const [form, setForm] = useState(() => createForm(user))

  useEffect(() => {
    setForm(createForm(user))
  }, [user])

  if (!user) {
    return null
  }

  const canEditPrivileges = Boolean(currentAdmin?.is_superuser)

  const updateField = (event) => {
    const { checked, name, type, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const payload = editableFields.reduce((nextPayload, field) => {
      nextPayload[field] = form[field]
      return nextPayload
    }, {})

    onSave(user.id, payload)
  }

  return (
    <div className="admin-modal-backdrop" role="presentation">
      <section
        aria-labelledby="edit-user-title"
        aria-modal="true"
        className="admin-modal"
        role="dialog"
      >
        <div className="admin-modal-header">
          <div>
            <p className="eyebrow">Edit user</p>
            <h2 id="edit-user-title">{user.username}</h2>
          </div>
          <button type="button" className="admin-icon-button" onClick={onClose}>
            x
          </button>
        </div>

        <form className="admin-edit-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label>
              Username
              <input
                name="username"
                onChange={updateField}
                required
                value={form.username}
              />
            </label>

            <label>
              Email
              <input
                name="email"
                onChange={updateField}
                type="email"
                value={form.email}
              />
            </label>

            <label>
              First name
              <input
                name="first_name"
                onChange={updateField}
                value={form.first_name}
              />
            </label>

            <label>
              Last name
              <input
                name="last_name"
                onChange={updateField}
                value={form.last_name}
              />
            </label>
          </div>

          <div className="admin-toggle-grid">
            <label>
              <input
                checked={form.is_active}
                name="is_active"
                onChange={updateField}
                type="checkbox"
              />
              Active
            </label>

            <label>
              <input
                checked={form.is_staff}
                disabled={!canEditPrivileges}
                name="is_staff"
                onChange={updateField}
                type="checkbox"
              />
              Staff
            </label>

            <label>
              <input
                checked={form.is_superuser}
                disabled={!canEditPrivileges}
                name="is_superuser"
                onChange={updateField}
                type="checkbox"
              />
              Superuser
            </label>
          </div>

          {!canEditPrivileges && (
            <p className="admin-muted">
              Only superusers can change staff and superuser flags.
            </p>
          )}

          <div className="action-row">
            <button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
