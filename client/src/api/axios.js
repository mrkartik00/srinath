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
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  let data;
  try { data = await res.json(); } catch { throw new Error('Server not reachable. Please try again.'); }
  if (res.status === 401) {
    const hadToken = !!localStorage.getItem('token');
    if (hadToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    throw new Error(data.message || 'Invalid credentials');
  }
  if (!res.ok) {
    let errorMsg = data.message;
    if (data.errors) {
      if (Array.isArray(data.errors)) {
        errorMsg = data.errors.join(', ');
      } else if (typeof data.errors === 'object') {
        errorMsg = Object.values(data.errors)
          .map(e => (typeof e === 'string' ? e : e.message))
          .filter(Boolean)
          .join(', ') || errorMsg;
      } else if (typeof data.errors === 'string') {
        errorMsg = data.errors;
      }
    }
    throw new Error(errorMsg || 'Something went wrong');
  }
  return data;
}

export default api;
