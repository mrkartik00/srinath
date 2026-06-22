import api from '../axios';

export const getDashboardStats = () => api.get('/api/v1/dashboard');
