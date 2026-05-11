import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response.data,
  error => {
    if (!error.response) {
      return Promise.reject({
        error: 'Network error',
        message: 'Please check your internet connection'
      });
    }
    return Promise.reject(error.response.data);
  }
);

export const getMessages = (role, hours = 24) =>
  api.get('/messages', { params: { role, hours } });

export const getTickets = (role, phase) =>
  api.get('/tickets', { params: { role, phase } });

export const getUserProfile = (role) =>
  api.get('/user/profile', { params: { role } });

export const saveUserProfile = (profile) =>
  api.post('/user/profile', profile);

export const generateDigest = (userContext) =>
  api.post('/digest', userContext);

export const getCachedDigest = (role, phase) =>
  api.get('/digest/cache', { params: { role, phase } });

export const getSilenceAlerts = (role, phase) =>
  api.get('/silence', { params: { role, phase } });

export const summarizeThread = (threadId, messages) =>
  api.post('/thread/summarize', { thread_id: threadId, messages });

export default api;