import api from './axios';

export const bookAppointment = (data) => api.post('/api/v1/appointments', data);
export const getMyAppointments = (params) => api.get('/api/v1/appointments/my', { params });
export const cancelAppointment = (id, cancellationReason) =>
  api.patch(`/api/v1/appointments/${id}/cancel`, { cancellationReason });
