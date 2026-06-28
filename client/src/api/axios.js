const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = {
  get: (url, params = {}) =>
    fetch(`${API_BASE_URL}${url}?${new URLSearchParams(params)}`, {
      headers: getAuthHeaders(),
    }).then(handleResponse),

  post: (url, data) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  put: (url, data) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  patch: (url, data) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (url) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then(handleResponse),
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshToken() {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) throw new Error('No refresh token');
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  localStorage.setItem('token', data.data.accessToken);
  return data.data.accessToken;
}

async function handleResponse(res) {
  let data;
  try { data = await res.json(); } catch { throw new Error('Server not reachable. Please try again.'); }
  if (res.status === 401) {
    const hadToken = !!localStorage.getItem('token');
    if (hadToken && data.code !== 'EMAIL_NOT_VERIFIED') {
      // Try refresh
      try {
        await refreshToken();
        // Token refreshed — caller should retry. For simplicity, redirect to trigger re-fetch.
        window.location.reload();
        return;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.setItem('sessionExpired', 'true');
        window.location.href = '/login';
      }
    }
    const e = new Error(data.message || 'Invalid credentials');
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

export default api;
