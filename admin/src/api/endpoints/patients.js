import api from '../axios';

export const getPatients = (params) => api.get('/api/v1/patients', params);

export const getPatientById = (id) => api.get(`/api/v1/patients/${id}`);

export const getPatientAppointments = (id, params) =>
  api.get(`/api/v1/appointments`, { ...params, patientId: id });

export const updatePatient = (id, data) => api.put(`/api/v1/patients/${id}`, data);

export const deletePatient = (id) => api.delete(`/api/v1/patients/${id}`);
