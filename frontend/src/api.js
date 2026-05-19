const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

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

  const firstValue = Object.values(payload)[0]

  if (!firstValue) {
    return fallbackMessage
  }

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
    throw new Error(getErrorMessage(payload, 'Request failed.'))
  }

  return payload
}

export function registerUser(credentials) {
  return request('/api/register/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function loginUser(credentials) {
  return request('/api/token/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function refreshAccessToken(refresh) {
  return request('/api/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  })
}

export function fetchCurrentUser(accessToken) {
  return request('/api/me/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function fetchSecret(accessToken) {
  return request('/api/secret/', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function updateUsername(accessToken, payload) {
  return request('/api/account/username/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
}

export function changePassword(accessToken, payload) {
  return request('/api/account/password/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
}

export function deleteAccount(accessToken) {
  return request('/api/account/', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export function updateProfile(accessToken, payload) {
  return request('/api/account/profile/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
}

export function requestPasswordReset(email) {
  return request('/api/password-reset/request/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmPasswordReset(payload) {
  return request('/api/password-reset/confirm/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyEmail(token) {
  return request(`/api/verify-email/${token}/`)
}
