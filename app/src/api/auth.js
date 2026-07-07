import api from './axios';

export const register = (data) => api.post('/api/v1/auth/register', data);
export const login = (email, password) => api.post('/api/v1/auth/login', { email, password });
export const getMe = () => api.get('/api/v1/auth/me');
export const sendOtp = (email, purpose) => api.post('/api/v1/auth/send-otp', { email, purpose });
export const verifyOtp = (email, otp, purpose) => api.post('/api/v1/auth/verify-otp', { email, otp, purpose });
