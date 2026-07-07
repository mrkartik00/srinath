import api from './axios';
export const getVaultDocuments = (params) => api.get('/api/v1/vault/documents', { params });
export const getDocumentDownloadUrl = (id) => api.get(`/api/v1/vault/documents/${id}/download`);
export const deleteDocument = (id) => api.delete(`/api/v1/vault/documents/${id}`);
export const uploadDocument = async (formData, onProgress) => {
  return api.post('/api/v1/vault/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};
