import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const PORT = 5001;

function resolveBaseUrl() {
  const configured = Constants.expoConfig?.extra?.apiUrl;

  // If an explicit non-localhost URL is set, always honor it (prod/staging).
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;

  // Derive the dev machine's host from the Expo packager (works on
  // simulator, Android emulator, and physical devices on the same network).
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${PORT}`;

  // Fallbacks if the dev host can't be determined.
  if (Platform.OS === 'android') return `http://10.0.2.2:${PORT}`;
  return `http://localhost:${PORT}`;
}

const API_BASE_URL = 'https://api.janki.care';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(error.response?.data?.errors || error.response?.data?.message || 'Network error');
  }
);

export default api;
