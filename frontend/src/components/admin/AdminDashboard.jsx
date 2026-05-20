import { useEffect, useState } from 'react'
import {
  clearAdminSession,
  deleteAdminUser,
  fetchAdminUser,
  fetchAdminUsers,
  readAdminSession,
  updateAdminUser,
} from '../../adminApi'
import EditUserModal from './EditUserModal'
import UserTable from './UserTable'

export default function AdminDashboard({ onLogout, onRequireLogin }) {
  const [session, setSession] = useState(() => readAdminSession())
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

  const accessToken = session?.access

  useEffect(() => {
    if (!accessToken) {
      clearAdminSession()
      onRequireLogin()
      return
    }

    let isCancelled = false

    async function loadUsers() {
      setIsLoading(true)
      setStatus('')

      try {
        const data = await fetchAdminUsers(accessToken)

        if (!isCancelled) {
          setUsers(data)
        }
      } catch (error) {
        if (error.status === 401 || error.status === 403) {
          clearAdminSession()
          onRequireLogin()
          return
        }

        if (!isCancelled) {
          setStatus(error.message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isCancelled = true
    }
  }, [accessToken, onRequireLogin])

  const handleLogout = () => {
    clearAdminSession()
    setSession(null)
    onLogout()
  }

  const handleEdit = async (user) => {
    if (!accessToken) {
      onRequireLogin()
      return
    }

    setIsBusy(true)
    setStatus('')

    try {
      const detail = await fetchAdminUser(accessToken, user.id)
      setSelectedUser(detail)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleSave = async (userId, payload) => {
    if (!accessToken) {
      onRequireLogin()
      return
    }

    setIsBusy(true)
    setStatus('')

    try {
      const updatedUser = await updateAdminUser(accessToken, userId, payload)
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      setSelectedUser(null)
      setStatus(`${updatedUser.username} was updated.`)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleDelete = async (user) => {
    if (!accessToken) {
      onRequireLogin()
      return
    }

    const shouldDelete = window.confirm(
      `Delete ${user.username}? This action cannot be undone.`
    )

    if (!shouldDelete) {
      return
    }

    setIsBusy(true)
    setStatus('')

    try {
      await deleteAdminUser(accessToken, user.id)
      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id)
      )
      setStatus(`${user.username} was deleted.`)
    } catch (error) {
      setStatus(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="app-shell admin-shell">
      <section className="admin-panel">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Admin panel</p>
            <h1>Users</h1>
            <p className="panel-copy">
              Signed in as {session?.user?.username ?? 'admin'}.
            </p>
          </div>

          <div className="admin-header-actions">
            <button type="button" onClick={() => window.location.reload()}>
              Refresh
            </button>
            <button type="button" className="secondary-button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        {status && (
          <div className="status-banner" aria-live="polite">
            {status}
          </div>
        )}

        <div className="admin-summary-grid">
          <article className="admin-metric">
            <span>Total users</span>
            <strong>{users.length}</strong>
          </article>
          <article className="admin-metric">
            <span>Staff</span>
            <strong>{users.filter((user) => user.is_staff).length}</strong>
          </article>
          <article className="admin-metric">
            <span>Active</span>
            <strong>{users.filter((user) => user.is_active).length}</strong>
          </article>
        </div>

        {isLoading ? (
          <div className="admin-empty-state">
            <strong>Loading users...</strong>
          </div>
        ) : (
          <UserTable
            currentAdminId={session?.user?.id}
            isBusy={isBusy}
            onDelete={handleDelete}
            onEdit={handleEdit}
            users={users}
          />
        )}
      </section>

      <EditUserModal
        currentAdmin={session?.user}
        isSaving={isBusy}
        onClose={() => setSelectedUser(null)}
        onSave={handleSave}
        user={selectedUser}
      />
    </main>
  )
}
