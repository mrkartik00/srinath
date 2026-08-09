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
      const newToken = data.data.accessToken;
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

async function handleResponse(res, retryFn) {
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Server not reachable. Please try again.');
  }

  if (res.status === 401) {
    const hadToken = !!localStorage.getItem('token');

    // Don't try refresh for EMAIL_NOT_VERIFIED
    if (data.code === 'EMAIL_NOT_VERIFIED' || !hadToken) {
      const e = new Error(data.message || 'Invalid credentials');
      e.response = { data, status: 401 };
      throw e;
    }

    // Attempt silent refresh + retry
    try {
      await silentRefresh();
      if (retryFn) {
        const retryRes = await retryFn();
        return handleResponse(retryRes, null); // don't retry again
      }
    } catch {
      // Refresh failed — hard logout
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.setItem('sessionExpired', 'true');
      window.location.href = '/login';
    }

    const e = new Error(data.message || 'Session expired');
    e.response = { data, status: 401 };
    throw e;
  }

  if (!res.ok) {
    const e = new Error(data.message || 'Something went wrong');
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
    return doFetch().then(res => handleResponse(res, doFetch));
  },

  post: (url, data) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return doFetch().then(res => handleResponse(res, doFetch));
  },

  put: (url, data) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return doFetch().then(res => handleResponse(res, doFetch));
  },

  patch: (url, data) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return doFetch().then(res => handleResponse(res, doFetch));
  },

  delete: (url) => {
    const doFetch = () => fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return doFetch().then(res => handleResponse(res, doFetch));
  },
};

export { silentRefresh };
export default api;
