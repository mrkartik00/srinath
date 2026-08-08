import api, { API_BASE_URL } from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getVaultDocuments = (params) => api.get('/api/v1/vault/documents', { params });
export const getDocumentDownloadUrl = (id) => api.get(`/api/v1/vault/documents/${id}/download`);
export const deleteDocument = (id) => api.delete(`/api/v1/vault/documents/${id}`);

/**
 * Upload a document to the vault.
 * Uses raw fetch() instead of the shared axios instance because axios's
 * instance-level Content-Type: application/json default cannot be reliably
 * overridden for FormData bodies in React Native — fetch() automatically
 * generates the correct multipart/form-data; boundary=... header.
 */
export const uploadDocument = async (formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/vault/upload`, {
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
