import api from '../axios';

export const getAppointments = (params) => api.get('/api/v1/appointments', params);

export const getAppointmentById = (id) => api.get(`/api/v1/appointments/${id}`);

export const cancelAppointment = (id, cancellationReason) =>
  api.patch(`/api/v1/appointments/${id}/cancel`, { cancellationReason });

export const completeAppointment = (id) =>
  api.patch(`/api/v1/appointments/${id}/complete`);

export const updateAppointment = (id, data) =>
  api.patch(`/api/v1/appointments/${id}`, data);
