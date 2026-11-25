const rawApiUrl = (import.meta.env?.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = rawApiUrl
  ? rawApiUrl.endsWith('/api/v1')
    ? rawApiUrl
    : `${rawApiUrl}/api/v1`
  : '/api/v1';

export const BACKEND_ORIGIN = rawApiUrl
  ? rawApiUrl.replace(/\/api\/v1$/, '')
  : '';

export const ACCESS_KEY = 'guraaha_access_token';
export const REFRESH_KEY = 'guraaha_refresh_token';
export const USER_KEY = 'guraaha_user';

// Safe cross-browser storage fallback (handles Safari Private Mode, iOS/Android WebViews, strict tracking prevention)
const memoryStore = new Map();

export const safeStorage = {
  getItem(key) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // ignore storage access errors
    }
    return memoryStore.get(key) ?? null;
  },
  setItem(key, value) {
    memoryStore.set(key, String(value));
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      // ignore quota/private mode errors
    }
  },
  removeItem(key) {
    memoryStore.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore errors
    }
  },
};

export function getAccessToken() {
  return safeStorage.getItem(ACCESS_KEY);
}

export function getStoredUser() {
  try {
    const raw = safeStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession({ accessToken, refreshToken, user }) {
  if (accessToken) safeStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) safeStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) safeStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  safeStorage.removeItem(ACCESS_KEY);
  safeStorage.removeItem(REFRESH_KEY);
  safeStorage.removeItem(USER_KEY);
}

let refreshInFlight = null;

export async function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = safeStorage.getItem(REFRESH_KEY);
  if (!refreshToken) {
    clearSession();
    throw new Error('Session expired');
  }

  refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        clearSession();
        throw new Error(json.message || 'Session expired');
      }
      setSession(json.data);
      return json.data;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export async function api(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = false,
    form = false,
    retry = true,
  } = options;

  const headers = { Accept: 'application/json' };
  if (!form && body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (auth) {
    throw new Error('Please log in to continue');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: form ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry && safeStorage.getItem(REFRESH_KEY)) {
    await refreshSession();
    return api(path, { ...options, retry: false });
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || 'Request failed');
    error.status = res.status;
    error.details = json.errors;
    throw error;
  }

  return json;
}
