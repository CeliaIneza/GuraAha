const API_BASE = '/api/v1';

export const ACCESS_KEY = 'guraaha_access_token';
export const REFRESH_KEY = 'guraaha_refresh_token';
export const USER_KEY = 'guraaha_user';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

let refreshInFlight = null;

export async function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
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

  const headers = {};
  if (!form) headers['Content-Type'] = 'application/json';

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

  if (res.status === 401 && retry && localStorage.getItem(REFRESH_KEY)) {
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
