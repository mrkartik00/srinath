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

async function handleResponse(res) {
  const data = await res.json();

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export default api;
