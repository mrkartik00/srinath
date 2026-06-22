import api from '../axios';

export const login = (email, password) => api.post('/api/v1/auth/login', { email, password });

export const getMe = () => api.get('/api/v1/auth/me');

export const register = (data) => api.post('/api/v1/auth/register', data);
