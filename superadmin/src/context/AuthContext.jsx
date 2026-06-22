import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/v1/auth/me')
        .then((res) => { setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data)); })
        .catch(() => { localStorage.clear(); setUser(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = (token, userData) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(userData)); setUser(userData); };
  const logout = () => { localStorage.clear(); setUser(null); };

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
