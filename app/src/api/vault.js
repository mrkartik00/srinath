import api from './axios';
export const getVaultDocuments = (params) => api.get('/api/v1/vault/documents', { params });
export const getDocumentDownloadUrl = (id) => api.get(`/api/v1/vault/documents/${id}/download`);
export const deleteDocument = (id) => api.delete(`/api/v1/vault/documents/${id}`);
export const uploadDocument = async (formData, onProgress) => {
  // The shared `api` instance defaults to Content-Type: application/json.
  // Axios's transformRequest checks that default and, if present, JSON-
  // stringifies FormData bodies instead of sending them as multipart — so
  // it must be explicitly cleared here to let the platform generate the
  // real multipart boundary.
  return api.post('/api/v1/vault/upload', formData, {
    headers: { 'Content-Type': undefined },
    onUploadProgress: onProgress,
  });
};
