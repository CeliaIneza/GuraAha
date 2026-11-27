import { api } from './client';

export const authApi = {
  me: () => api('/auth/me', { auth: true }),
  register: (payload) => api('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => api('/auth/login', { method: 'POST', body: payload }),
  refresh: (refreshToken) =>
    api('/auth/refresh', { method: 'POST', body: { refreshToken }, retry: false }),
  logout: (refreshToken) =>
    api('/auth/logout', { method: 'POST', body: { refreshToken }, auth: true, retry: false }),
  sendVerification: () =>
    api('/auth/verification/send', { method: 'POST', auth: true }),
  verifyAccount: (code) =>
    api('/auth/verification/verify', { method: 'POST', body: { code }, auth: true }),
  forgotPassword: (emailOrIdentifier) =>
    api('/auth/forgot-password', {
      method: 'POST',
      body: { email: emailOrIdentifier, identifier: emailOrIdentifier },
    }),
  resetPassword: (tokenOrObj, maybePassword) => {
    const body =
      typeof tokenOrObj === 'object' && tokenOrObj !== null
        ? tokenOrObj
        : { token: tokenOrObj, password: maybePassword };
    return api('/auth/reset-password', { method: 'POST', body });
  },
  updateProfile: (payload) =>
    api('/auth/profile', { method: 'PATCH', body: payload, auth: true }),
  changePassword: (currentPasswordOrObj, maybeNewPassword) => {
    const body =
      typeof currentPasswordOrObj === 'object' && currentPasswordOrObj !== null
        ? currentPasswordOrObj
        : { currentPassword: currentPasswordOrObj, newPassword: maybeNewPassword };
    return api('/auth/change-password', {
      method: 'POST',
      body,
      auth: true,
    });
  },
};
