import api from '../axios';

export const register = (data) => api.post('/api/v1/auth/register', data);
export const login = (email, password) => api.post('/api/v1/auth/login', { email, password });
export const getMe = () => api.get('/api/v1/auth/me');
export const getDoctors = () => api.get('/api/v1/auth/doctors');
export const sendOtp = (email, purpose = 'registration') => api.post('/api/v1/auth/send-otp', { email, purpose });
export const verifyOtp = (email, otp, purpose = 'registration') => api.post('/api/v1/auth/verify-otp', { email, otp, purpose });
export const forgotPassword = (email) => api.post('/api/v1/auth/forgot-password', { email });
export const resetPassword = (email, otp, newPassword) => api.post('/api/v1/auth/reset-password', { email, otp, newPassword });
