import { api } from './client';

export const settingsApi = {
  getAll: () => api('/settings', { auth: true }),
  update: (key, value) => api(`/settings/${key}`, { method: 'PUT', body: { value: String(value) }, auth: true }),
};
