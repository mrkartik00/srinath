import api from './axios';
export const getMyPrescriptions = (params) => api.get('/api/v1/my/prescriptions', { params });
export const getPrescriptionPdfUrl = (id) => `${api.defaults.baseURL}/api/v1/my/prescriptions/${id}/pdf`;
