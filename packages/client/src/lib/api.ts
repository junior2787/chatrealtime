import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; password: string; name: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const roomsApi = {
  list: () => api.get('/rooms'),
  public: () => api.get('/rooms/public'),
  get: (id: string) => api.get(`/rooms/${id}`),
  create: (data: { name: string; description?: string; isPrivate?: boolean }) => api.post('/rooms', data),
  update: (id: string, data: { name?: string; description?: string; isPrivate?: boolean }) => api.put(`/rooms/${id}`, data),
  join: (id: string) => api.post(`/rooms/${id}/join`),
  leave: (id: string) => api.post(`/rooms/${id}/leave`),
  delete: (id: string) => api.delete(`/rooms/${id}`),
};

export const messagesApi = {
  list: (roomId: string, params?: { page?: number; limit?: number }) => api.get(`/messages/${roomId}`, { params }),
  send: (roomId: string, data: { content: string; type?: 'text' | 'image' | 'file'; replyToId?: string | null }) => api.post(`/messages/${roomId}`, data),
  edit: (roomId: string, messageId: string, data: { content: string }) => api.put(`/messages/${roomId}/${messageId}`, data),
  delete: (roomId: string, messageId: string) => api.delete(`/messages/${roomId}/${messageId}`),
};

export const usersApi = {
  search: (q: string) => api.get('/users/search', { params: { q } }),
  online: () => api.get('/users/online'),
  get: (id: string) => api.get(`/users/${id}`),
  updateMe: (data: { name?: string; avatar?: string }) => api.put('/users/me', data),
};