import api from '../axios';

export const startCall = (appointmentId) =>
  api.post(`/api/v1/appointments/${appointmentId}/video/start`);

export const joinCall = (appointmentId) =>
  api.get(`/api/v1/appointments/${appointmentId}/video/join`);

export const endCall = (appointmentId) =>
  api.post(`/api/v1/appointments/${appointmentId}/video/end`);
