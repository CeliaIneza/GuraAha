import { api } from './client';

export const authApi = {
  register: (payload) => api('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => api('/auth/login', { method: 'POST', body: payload }),
  me: () => api('/auth/me', { auth: true }),
  logout: (refreshToken) => api('/auth/logout', { method: 'POST', body: { refreshToken } }),
};
