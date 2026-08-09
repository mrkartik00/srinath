import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { emitUnauthorized } from '../utils/authEvents';

const PORT = 5001;

function resolveBaseUrl() {
  // 1. Environment variable override (set during build or in .env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Configured production/staging URL from app.json (e.g. https://api.janki.care)
  const configured = Constants.expoConfig?.extra?.apiUrl;
  if (configured) return configured;

  // 3. Dev fallback: derive host from Expo packager if no production API configured
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (__DEV__ && host) return `http://${host}:${PORT}`;

  // 4. Last-resort fallbacks
  if (Platform.OS === 'android') return `http://10.0.2.2:${PORT}`;
  return `http://localhost:${PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If the payload is FormData, strip the default Content-Type header so the
  // platform can append its own boundary parameter (e.g. multipart/form-data)
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

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

// GAP 6: ensure the hard-logout side effects run only once even if many
// concurrent requests fail their refresh at the same time.
let loggingOut = false;
async function handleHardLogout() {
  if (loggingOut) return;
  loggingOut = true;
  try {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    emitUnauthorized();
  } finally {
    setTimeout(() => { loggingOut = false; }, 1000);
  }
}

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const data = error.response?.data;

    // Silent refresh only for expired tokens on authenticated (non-auth) endpoints.
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthPath(originalRequest.url) &&
      data?.code !== 'EMAIL_NOT_VERIFIED'
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await silentRefresh();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return await api(originalRequest);
      } catch (refreshError) {
        await handleHardLogout();
        return Promise.reject(
          data?.errors || data?.message || error.message || 'Session expired'
        );
      }
    }

    // GAP 2: give the login screen a structured error so it can detect
    // EMAIL_NOT_VERIFIED and route to the OTP screen. All other errors keep
    // the existing string/array shape for backward compatibility.
    if (status === 401 && data?.code === 'EMAIL_NOT_VERIFIED') {
      const e = new Error(data.message || 'Please verify your email');
      e.response = { data, status };
      return Promise.reject(e);
    }

    return Promise.reject(
      data?.errors || data?.message || error.message || 'Network error'
    );
  }
);

// Single-flight refresh: share one refresh promise across concurrent 401s
let refreshPromise = null;

async function silentRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const rt = await AsyncStorage.getItem('refreshToken');
      if (!rt) throw new Error('No refresh token');

      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken: rt });
      const newToken = res.data?.data?.accessToken;
      if (!newToken) throw new Error('No access token in response');

      await AsyncStorage.setItem('token', newToken);
      return newToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export { silentRefresh };

/**
 * Authenticated multipart/form-data upload with silent-refresh + one retry.
 * Uses raw fetch() (not the axios instance) so React Native can set the
 * correct multipart boundary Content-Type automatically. On a 401 it refreshes
 * the token once and retries; if the refresh fails it triggers a hard logout.
 */
export async function authedUpload(url, formData) {
  const doUpload = async () => {
    const token = await AsyncStorage.getItem('token');
    return fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  };

  let response = await doUpload();

  if (response.status === 401) {
    try {
      await silentRefresh();
      response = await doUpload();
    } catch {
      await handleHardLogout();
    }
  }

  const json = await response.json();
  if (!response.ok) {
    throw json?.message || json?.errors || `Upload failed (${response.status})`;
  }
  return json;
}

export default api;
