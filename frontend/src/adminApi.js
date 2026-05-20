const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export const adminStorageKey = 'admin-session'

function getErrorMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload[0]
  }

  if (payload.detail) {
    return getErrorMessage(payload.detail, fallbackMessage)
  }

  if (payload.non_field_errors) {
    return getErrorMessage(payload.non_field_errors, fallbackMessage)
  }

  const firstValue = Object.values(payload)[0]
  return getErrorMessage(firstValue, fallbackMessage)
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(getErrorMessage(payload, 'Request failed.'))
    error.status = response.status
    throw error
  }

  return payload
}

function authorizedRequest(accessToken, path, options = {}) {
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  })
}

export function readAdminSession() {
  const storedSession = localStorage.getItem(adminStorageKey)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    localStorage.removeItem(adminStorageKey)
    return null
  }
}

export function writeAdminSession(session) {
  localStorage.setItem(adminStorageKey, JSON.stringify(session))
}

export function clearAdminSession() {
  localStorage.removeItem(adminStorageKey)
}

export function adminLogin(credentials) {
  return request('/api/admin/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function fetchAdminUsers(accessToken) {
  return authorizedRequest(accessToken, '/api/admin/users/')
}

export function fetchAdminUser(accessToken, userId) {
  return authorizedRequest(accessToken, `/api/admin/users/${userId}/`)
}

export function updateAdminUser(accessToken, userId, payload, method = 'PATCH') {
  return authorizedRequest(accessToken, `/api/admin/users/${userId}/`, {
    method,
    body: JSON.stringify(payload),
  })
}

export function deleteAdminUser(accessToken, userId) {
  return authorizedRequest(accessToken, `/api/admin/users/${userId}/`, {
    method: 'DELETE',
  })
}
