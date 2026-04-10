// In dev with no VITE_API_URL, use relative URL so Vite proxy can forward /api to the backend
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:3001')

export function getApiUrl(path = '') {
  return `${API_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export async function api(path, options = {}) {
  const url = getApiUrl(path)
  let res
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch (e) {
    if (e?.message === 'Failed to fetch' || e?.name === 'TypeError') {
      throw new Error(`Could not reach the server. Is the API running at ${API_URL}? Start it with: cd server && npm start`)
    }
    throw e
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data.error || res.statusText || 'Request failed'
    if (res.status === 404 && url.includes('contact')) {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || 'http://localhost:3001'
      throw new Error(`Could not send message (Not found). Make sure the backend is running: cd server && npm start. API URL: ${base}`)
    }
    throw new Error(data.message || msg)
  }
  return data
}

export function apiWithAuth(path, options = {}, token) {
  const t = token || (typeof window !== 'undefined' && localStorage.getItem('ballu-admin-token'))
  return api(path, {
    ...options,
    headers: {
      ...options.headers,
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    },
  })
}
