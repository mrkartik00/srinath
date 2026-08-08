import api from './axios';
export const getTodayReminders = () => api.get('/api/v1/my/reminders');
export const acknowledgeReminder = (id) => api.patch(`/api/v1/my/reminders/${id}/ack`);
export const snoozeReminder = (id, minutes = 15) => api.patch(`/api/v1/my/reminders/${id}/snooze`, { minutes });
export const missReminder = (id) => api.patch(`/api/v1/my/reminders/${id}/miss`);
