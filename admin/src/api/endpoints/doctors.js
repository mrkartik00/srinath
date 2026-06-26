import api from '../axios';

export const getDoctors = (params) => api.get('/api/v1/admin/doctors', params);
export const getDoctorById = (id) => api.get(`/api/v1/admin/doctors/${id}`);
export const addDoctor = (data) => api.post('/api/v1/admin/doctors', data);
export const updateDoctor = (id, data) => api.patch(`/api/v1/admin/doctors/${id}`, data);
export const deactivateDoctor = (id) => api.delete(`/api/v1/admin/doctors/${id}`);
export const reactivateDoctor = (id) => api.patch(`/api/v1/admin/doctors/${id}/reactivate`);
