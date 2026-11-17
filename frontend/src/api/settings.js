import { api } from './client';

export const settingsApi = {
  getPublic: () => api('/settings/public'),
  getAll: () => api('/settings', { auth: true }),
  update: (key, value) => api(`/settings/${key}`, { method: 'PUT', body: { value: typeof value === 'string' ? value : JSON.stringify(value) }, auth: true }),
};
