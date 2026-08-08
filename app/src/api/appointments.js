import api from './axios';
export const getMyAppointments = (params) => api.get('/api/v1/appointments/my', { params });
export const getAppointmentById = (id) => api.get(`/api/v1/appointments/${id}`);
export const createAppointment = (data) => api.post('/api/v1/appointments', data);
export const cancelAppointment = (id, data) => api.patch(`/api/v1/appointments/${id}/cancel`, data);
