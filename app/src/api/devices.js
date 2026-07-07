import api from './axios';
export const registerDevice = (token, platform) => api.post('/api/v1/devices', { token, platform });
export const unregisterDevice = (token) => api.delete(`/api/v1/devices/${token}`);
