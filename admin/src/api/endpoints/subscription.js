import api from '../axios';
export const getMySubscription = () => api.get('/api/v1/doctor/subscription');
export const getPlans = () => api.get('/api/v1/config/plans');
