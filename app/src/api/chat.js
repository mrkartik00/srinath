import api, { authedUpload } from './axios';

export const getConversations = () => api.get('/api/v1/chat/conversations');
export const createConversation = (doctorId) => api.post('/api/v1/chat/conversations', { doctorId });
export const getMessages = (conversationId, params) => api.get(`/api/v1/chat/conversations/${conversationId}/messages`, { params });
export const getAttachmentUrl = (messageId, index = 0) => api.get(`/api/v1/chat/attachments/${messageId}/download`, { params: { index } });
export const shareVaultInChat = (conversationId, vaultDocumentIds, caption) => api.post(`/api/v1/chat/conversations/${conversationId}/share-vault`, { vaultDocumentIds, caption });

/**
 * Upload a file attachment in a chat conversation.
 * Uses authedUpload (raw fetch under the hood) so React Native sets the correct
 * multipart/form-data boundary, while still getting silent-refresh + retry on 401.
 */
export const uploadChatFile = (conversationId, formData) =>
  authedUpload(`/api/v1/chat/conversations/${conversationId}/upload`, formData);
