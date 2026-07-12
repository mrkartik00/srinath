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
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data);
        } catch {
          await AsyncStorage.multiRemove(['token', 'user']);
        }
      }
      setLoading(false);
    })();
  }, []);

  // A 401 from the API means the token is no longer valid on the server
  // (expired, revoked, etc). axios.js already wipes AsyncStorage; this
  // clears the in-memory user too, so the navigator drops back to the
  // Auth stack instead of continuing to render as if still logged in.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const loginAction = async (token, userData) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    setJustLoggedIn(true);
    setUser(userData);
    // TODO: Push notification registration skipped — expo-notifications not installed.
    // Install with: npx expo install expo-notifications, then register token via POST /api/v1/devices
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
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
