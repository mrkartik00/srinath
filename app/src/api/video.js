import api from './axios';

export const joinVideoCall = (appointmentId) =>
  api.get(`/api/v1/appointments/${appointmentId}/video/join`);
