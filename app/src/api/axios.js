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
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      emitUnauthorized();
    }
    return Promise.reject(
      error.response?.data?.errors || error.response?.data?.message || error.message || 'Network error'
    );
  }
);

export default api;
