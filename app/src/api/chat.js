import api from './axios';
export const getConversations = () => api.get('/api/v1/chat/conversations');
export const createConversation = (doctorId) => api.post('/api/v1/chat/conversations', { doctorId });
export const getMessages = (conversationId, params) => api.get(`/api/v1/chat/conversations/${conversationId}/messages`, { params });
export const getAttachmentUrl = (messageId) => api.get(`/api/v1/chat/attachments/${messageId}/download`);
// The shared `api` instance defaults to Content-Type: application/json,
// which makes axios JSON-stringify FormData bodies instead of sending them
// as multipart (see api/vault.js) — clear it explicitly for this request.
export const uploadChatFile = (conversationId, formData) =>
  api.post(`/api/v1/chat/conversations/${conversationId}/upload`, formData, {
    headers: { 'Content-Type': undefined },
  });
