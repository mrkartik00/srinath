import api from '../axios';

export const getPrescriptions = (params) => api.get('/api/v1/prescriptions', params);
export const getPrescriptionById = (id) => api.get(`/api/v1/prescriptions/${id}`);
export const createPrescription = (data) => api.post('/api/v1/prescriptions', data);
export const cancelPrescription = (id) => api.patch(`/api/v1/prescriptions/${id}/cancel`);
export const getPrescriptionAdherence = (id) => api.get(`/api/v1/prescriptions/${id}/adherence`);
