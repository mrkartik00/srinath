import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe } from '../api/auth';
import { onUnauthorized } from '../utils/authEvents';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [token, storedUser] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);

        if (storedUser && active) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {}
        }

        if (token && active) {
          // Validate token in background with a 4s timeout
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          try {
            const res = await getMe({ signal: controller.signal });
            clearTimeout(timer);
            if (active && res?.data) {
              setUser(res.data);
              await AsyncStorage.setItem('user', JSON.stringify(res.data));
            }
          } catch (err) {
            clearTimeout(timer);
            // Only clear session if server explicitly returned 401 unauthorized
            if (err?.response?.status === 401 && active) {
              await AsyncStorage.multiRemove(['token', 'user']);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Auth init warning:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // A 401 from the API means the token is no longer valid on the server
  // (expired, revoked, etc). axios.js already wipes AsyncStorage; this
  // clears the in-memory user too, so the navigator drops back to the
  // Auth stack instead of continuing to render as if still logged in.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const loginAction = async (token, userData, refreshToken) => {
    await AsyncStorage.setItem('token', token);
    if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setJustLoggedIn(true);
    setUser(userData);
    // TODO: Push notification registration skipped — expo-notifications not installed.
    // Install with: npx expo install expo-notifications, then register token via POST /api/v1/devices
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login: loginAction, logout, loading, justLoggedIn, setJustLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
