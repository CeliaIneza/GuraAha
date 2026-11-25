import { api } from './client';

export const blockersApi = {
  apply: (payload) => api('/blockers/apply', { method: 'POST', body: payload }),
  applyPublic: (payload) => api('/blockers/apply', { method: 'POST', body: payload }),
  me: () => api('/blockers/application/me', { auth: true }),
  pending: () => api('/blockers/applications', { auth: true }),
  approve: (id) => api(`/blockers/applications/${id}/approve`, { method: 'PATCH', auth: true }),
  reject: (id, rejectionReason) =>
    api(`/blockers/applications/${id}/reject`, {
      method: 'PATCH',
      body: { rejectionReason },
      auth: true,
    }),
  suspend: (id) =>
    api(`/blockers/applications/${id}/suspend`, {
      method: 'PATCH',
      auth: true,
    }),
  resetPassword: (id, password) =>
    api(`/blockers/applications/${id}/reset-password`, {
      method: 'POST',
      body: password ? { password } : {},
      auth: true,
    }),
  adminResetPassword: (id, payloadOrPassword) => {
    const password =
      typeof payloadOrPassword === 'object'
        ? payloadOrPassword.newPassword || payloadOrPassword.password
        : payloadOrPassword;
    return api(`/blockers/applications/${id}/reset-password`, {
      method: 'POST',
      body: password ? { password } : {},
      auth: true,
    });
  },
  adminSave: (payload) =>
    api('/blockers/admin/save', {
      method: 'POST',
      body: payload,
      auth: true,
    }),
  adminCreate: (payload) =>
    api('/blockers/admin/save', {
      method: 'POST',
      body: payload,
      auth: true,
    }),
  delete: (id) =>
    api(`/blockers/applications/${id}`, {
      method: 'DELETE',
      auth: true,
    }),
};
