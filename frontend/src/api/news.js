import { api } from './client';

export const newsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.topic && params.topic !== 'All') qs.set('topic', params.topic);
    if (params.district) qs.set('district', params.district);
    if (params.limit) qs.set('limit', String(params.limit));
    const str = qs.toString();
    return api(`/news${str ? `?${str}` : ''}`);
  },
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.topic && params.topic !== 'All') qs.set('topic', params.topic);
    if (params.district) qs.set('district', params.district);
    if (params.limit) qs.set('limit', String(params.limit));
    const str = qs.toString();
    return api(`/news${str ? `?${str}` : ''}`);
  },
  getById: (id) => api(`/news/${id}`),
  getAllAdmin: () => api('/news/admin/all', { auth: true }),
  adminGetAll: () => api('/news/admin/all', { auth: true }),
  adminSave: (payload) => api('/news/admin/save', { method: 'POST', body: payload, auth: true }),
  create: (payload) => api('/news/admin/save', { method: 'POST', body: payload, auth: true }),
  update: (id, payload) => {
    if (Object.keys(payload || {}).length === 1 && payload.isPublished !== undefined) {
      return api(`/news/${id}/toggle-publish`, { method: 'PATCH', auth: true });
    }
    return api('/news/admin/save', { method: 'POST', body: { id, ...payload }, auth: true });
  },
  togglePublish: (id) => api(`/news/${id}/toggle-publish`, { method: 'PATCH', auth: true }),
  push: (id) => api(`/news/${id}/push`, { method: 'POST', auth: true }),
  pushNotification: (id) => api(`/news/${id}/push`, { method: 'POST', auth: true }),
  delete: (id) => api(`/news/${id}`, { method: 'DELETE', auth: true }),
  subscribeAlerts: (payload) => api('/alerts/subscribe', { method: 'POST', body: payload }),
};
