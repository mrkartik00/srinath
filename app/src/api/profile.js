import api from './axios';
export const getMyProfile = () => api.get('/api/v1/patients/me');
export const getMyStats = () => api.get('/api/v1/patients/me/stats');
export const updateMyProfile = (data) => api.put('/api/v1/patients/me', data);
export const uploadAvatar = (formData) => api.post('/api/v1/auth/avatar', formData, { headers: { 'Content-Type': undefined } });
export const removeAvatar = () => api.delete('/api/v1/auth/avatar');
