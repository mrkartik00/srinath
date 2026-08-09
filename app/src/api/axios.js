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

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept refresh calls or already-retried requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // Skip refresh for EMAIL_NOT_VERIFIED errors
      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        return Promise.reject(
          error.response?.data?.errors || error.response?.data?.message || error.message || 'Network error'
        );
      }

      originalRequest._retry = true;

      try {
        const newToken = await silentRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        const retryRes = await api(originalRequest);
        return retryRes;
      } catch (refreshError) {
        // Refresh failed — hard logout
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        emitUnauthorized();
        return Promise.reject(
          error.response?.data?.errors || error.response?.data?.message || error.message || 'Session expired'
        );
      }
    }

    return Promise.reject(
      error.response?.data?.errors || error.response?.data?.message || error.message || 'Network error'
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
export default api;
