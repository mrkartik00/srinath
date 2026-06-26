import api from '../axios';

export const createProfile = (data) => api.post('/api/v1/patients', data);
export const getMyProfile = () => api.get('/api/v1/patients/me');
export const updateMyProfile = (data) => api.put('/api/v1/patients/me', data);
export const getMyStats = () => api.get('/api/v1/patients/me/stats');
export const getPatientPlans = () => api.get('/api/v1/config/plans');
