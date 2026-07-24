import api from '../axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Join a video call as authenticated patient.
 * Uses the auth-intercepted api instance.
 */
export const joinCall = (appointmentId) =>
  api.get(`/api/v1/appointments/${appointmentId}/video/join`);

/**
 * Join a video call as a guest (public link, no auth).
 * Does NOT use the auth api instance — makes a plain fetch.
 */
export const guestJoin = async (roomCode, name) => {
  const url = `${API_BASE_URL}/api/v1/video/guest/${encodeURIComponent(roomCode)}?name=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Server not reachable. Please try again.');
  }
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong');
    err.response = { data, status: res.status };
    throw err;
  }
  return data;
};
