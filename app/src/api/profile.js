import api, { authedUpload } from './axios';

export const getMyProfile = () => api.get('/api/v1/patients/me');
export const getMyStats = () => api.get('/api/v1/patients/me/stats');
export const updateMyProfile = (data) => api.put('/api/v1/patients/me', data);
export const removeAvatar = () => api.delete('/api/v1/auth/avatar');

export const uploadAvatar = (formData) => authedUpload('/api/v1/auth/avatar', formData);

