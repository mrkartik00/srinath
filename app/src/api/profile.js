import api, { API_BASE_URL } from './axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getMyProfile = () => api.get('/api/v1/patients/me');
export const getMyStats = () => api.get('/api/v1/patients/me/stats');
export const updateMyProfile = (data) => api.put('/api/v1/patients/me', data);
export const removeAvatar = () => api.delete('/api/v1/auth/avatar');

export const uploadAvatar = async (formData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await response.json();
  if (!response.ok) throw json?.message || `Upload failed (${response.status})`;
  return json;
};

