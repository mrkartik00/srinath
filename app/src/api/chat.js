import api from './axios';
export const getConversations = () => api.get('/api/v1/chat/conversations');
export const createConversation = (doctorId) => api.post('/api/v1/chat/conversations', { doctorId });
export const getMessages = (conversationId, params) => api.get(`/api/v1/chat/conversations/${conversationId}/messages`, { params });
export const getAttachmentUrl = (messageId) => api.get(`/api/v1/chat/attachments/${messageId}/download`);
