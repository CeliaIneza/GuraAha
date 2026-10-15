import { api } from './client';

export const blockersApi = {
  apply: (payload) => api('/blockers/apply', { method: 'POST', body: payload, auth: true }),
  me: () => api('/blockers/application/me', { auth: true }),
  pending: () => api('/blockers/applications', { auth: true }),
  approve: (id) => api(`/blockers/applications/${id}/approve`, { method: 'PATCH', auth: true }),
  reject: (id, rejectionReason) =>
    api(`/blockers/applications/${id}/reject`, {
      method: 'PATCH',
      body: { rejectionReason },
      auth: true,
    }),
};
