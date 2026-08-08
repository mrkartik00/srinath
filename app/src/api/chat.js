import api, { API_BASE_URL } from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getConversations = () => api.get('/api/v1/chat/conversations');
export const createConversation = (doctorId) => api.post('/api/v1/chat/conversations', { doctorId });
export const getMessages = (conversationId, params) => api.get(`/api/v1/chat/conversations/${conversationId}/messages`, { params });
export const getAttachmentUrl = (messageId, index = 0) => api.get(`/api/v1/chat/attachments/${messageId}/download`, { params: { index } });
export const shareVaultInChat = (conversationId, vaultDocumentIds, caption) => api.post(`/api/v1/chat/conversations/${conversationId}/share-vault`, { vaultDocumentIds, caption });

/**
 * Upload a file attachment in a chat conversation.
 * Uses raw fetch() instead of the shared axios instance because axios's
 * instance-level Content-Type: application/json default cannot be reliably
 * overridden for FormData bodies in React Native — fetch() automatically
 * generates the correct multipart/form-data; boundary=... header.
 */
export const uploadChatFile = async (conversationId, formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${conversationId}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — fetch sets it automatically with boundary
    },
    body: formData,
  });

  const json = await response.json();
  if (!response.ok) {
    throw json?.message || json?.errors || `Upload failed (${response.status})`;
  }
  return json;
};
