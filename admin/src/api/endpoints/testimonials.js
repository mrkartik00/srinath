import api from '../axios';

export const getTestimonials = () => api.get('/api/v1/doctor/profile').then(r => r.data?.profile?.testimonials || []);
export const addTestimonial = (data) => api.post('/api/v1/doctor/testimonials', data);
export const updateTestimonial = (tid, data) => api.patch(`/api/v1/doctor/testimonials/${tid}`, data);
export const deleteTestimonial = (tid) => api.delete(`/api/v1/doctor/testimonials/${tid}`);
export const getReviews = (status) => api.get(`/api/v1/doctor/reviews${status ? `?status=${status}` : ''}`);
export const approveReview = (id) => api.patch(`/api/v1/doctor/reviews/${id}/approve`);
export const rejectReview = (id) => api.patch(`/api/v1/doctor/reviews/${id}/reject`);
