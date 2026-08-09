import api, { authedUpload } from './axios';

export const getVaultDocuments = (params) => api.get('/api/v1/vault/documents', { params });
export const getDocumentDownloadUrl = (id) => api.get(`/api/v1/vault/documents/${id}/download`);
export const deleteDocument = (id) => api.delete(`/api/v1/vault/documents/${id}`);

/**
 * Upload a document to the vault.
 * Uses authedUpload (raw fetch under the hood) so React Native sets the correct
 * multipart/form-data boundary, while still getting silent-refresh + retry on 401.
 */
export const uploadDocument = (formData) => authedUpload('/api/v1/vault/upload', formData);
