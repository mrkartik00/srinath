const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Single-flight refresh state
let refreshPromise = null;

async function silentRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const rt = localStorage.getItem('refreshToken');
      if (!rt) throw new Error('No refresh token');

      const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) throw new Error('Refresh failed');

      const data = await res.json();
      const newToken = data?.data?.accessToken;
      if (!newToken) throw new Error('No access token in refresh response');
      localStorage.setItem('token', newToken);
      return newToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Auth endpoints must never trigger the silent-refresh/retry path — a 401 here
// is a genuine credential/verification error, not an expired session.
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/register-doctor',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/send-otp',
  '/auth/verify-otp',
];

function isAuthPath(url = '') {
  return AUTH_PATHS.some((p) => url.includes(p));
}

function hardLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.setItem('sessionExpired', 'true');
  window.location.href = '/login';
}

// `url` is the request path; `retryFn` re-issues the original request after a
// successful refresh. When retryFn is null, this response is already a retry.
async function handleResponse(res, url, retryFn) {
  let data;
  try { data = await res.json(); } catch { throw new Error('Server not reachable. Please try again.'); }

  if (res.status === 401) {
    const hadToken = !!localStorage.getItem('token');

    // Don't refresh for auth endpoints, EMAIL_NOT_VERIFIED, no token, or a
    // request that has already been retried once.
    if (data?.code === 'EMAIL_NOT_VERIFIED' || !hadToken || isAuthPath(url) || !retryFn) {
      // A retry that still 401s means refresh didn't help — end the session.
      if (!retryFn && hadToken && data?.code !== 'EMAIL_NOT_VERIFIED' && !isAuthPath(url)) {
        hardLogout();
      }
      const e = new Error(data?.message || 'Session expired');
      e.response = { data, status: 401 };
      throw e;
    }

    // Attempt silent refresh + one retry.
    try {
      await silentRefresh();
    } catch {
      hardLogout();
      const e = new Error(data?.message || 'Session expired');
      e.response = { data, status: 401 };
      throw e;
    }
    const retryRes = await retryFn();
    return handleResponse(retryRes, url, null); // null => don't retry again
  }

  if (!res.ok) {
    const e = new Error(data?.message || 'Something went wrong');
    e.response = { data, status: res.status };
    throw e;
  }

  return data;
}

const api = {
  get: (url, params = {}) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}?${new URLSearchParams(params)}`, {
      headers: getAuthHeaders(),
    });
    return doFetch().then(res => handleResponse(res, url, doFetch));
  },

  post: (url, data) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return doFetch().then(res => handleResponse(res, url, doFetch));
  },

  put: (url, data) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return doFetch().then(res => handleResponse(res, url, doFetch));
  },

  patch: (url, data) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return doFetch().then(res => handleResponse(res, url, doFetch));
  },

  delete: (url) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return doFetch().then(res => handleResponse(res, url, doFetch));
  },
};

export { silentRefresh };
export default api;
