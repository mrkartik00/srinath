import api from './axios';
export const getDoctors = () => api.get('/api/v1/config/doctors');
export const getConstants = () => api.get('/api/v1/config/constants');
export const getPlans = () => api.get('/api/v1/config/plans');
