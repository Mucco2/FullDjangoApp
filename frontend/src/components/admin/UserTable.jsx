function formatDate(value) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getRole(user) {
  if (user.is_superuser) {
    return 'Superuser'
  }

  if (user.is_staff) {
    return 'Staff'
  }

  return 'User'
}

export default function UserTable({
  currentAdminId,
  isBusy,
  onDelete,
  onEdit,
  users,
}) {
  if (!users.length) {
    return (
      <div className="admin-empty-state">
        <strong>No users found.</strong>
      </div>
    )
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last login</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="admin-user-cell">
                  <span className="admin-user-avatar">
                    {user.username?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  <div>
                    <strong>{user.username}</strong>
                    <span>#{user.id}</span>
                  </div>
                </div>
              </td>
              <td>{user.email || 'No email'}</td>
              <td>
                <span className="admin-pill">{getRole(user)}</span>
              </td>
              <td>
                <span className={user.is_active ? 'admin-status active' : 'admin-status inactive'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{formatDate(user.last_login)}</td>
              <td>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => onEdit(user)} disabled={isBusy}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    disabled={isBusy || currentAdminId === user.id}
                    onClick={() => onDelete(user)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
