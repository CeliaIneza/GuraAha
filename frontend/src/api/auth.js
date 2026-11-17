import { api } from './client';

export const authApi = {
  register: (payload) => api('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => api('/auth/login', { method: 'POST', body: payload }),
  me: () => api('/auth/me', { auth: true }),
  logout: (refreshToken) => api('/auth/logout', { method: 'POST', body: { refreshToken } }),
  logoutAll: () => api('/auth/logout-all', { method: 'POST', auth: true }),
  sendVerification: () => api('/auth/verification/send', { method: 'POST', auth: true }),
  verifyAccount: (code) => api('/auth/verification/verify', { method: 'POST', body: { code }, auth: true }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (payload) => api('/auth/reset-password', { method: 'POST', body: payload }),
};
