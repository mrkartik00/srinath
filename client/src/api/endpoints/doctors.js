import api from '../axios';

export const getDoctorProfile = (id) => api.get(`/api/v1/config/doctors/${id}`);
export const submitReview = (doctorId, data) => api.post(`/api/v1/config/doctors/${doctorId}/reviews`, data);
