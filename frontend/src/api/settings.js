import { api } from './client';

export const settingsApi = {
  getAll: () => api('/settings'),
  update: (key, value) => api(`/settings/${key}`, { method: 'PATCH', body: { value: String(value) }, auth: true }),
};
