import { api } from './client';

function toQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const partnersApi = {
  getAll: (params) => api(`/partners${toQuery(params)}`),
  getById: (id) => api(`/partners/${id}`),
};
