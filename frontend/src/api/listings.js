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

export const listingsApi = {
  listApproved: (params) => api(`/listings${toQuery({ pageSize: 50, ...params })}`),
  getById: (id) => api(`/listings/${id}`),
  getPhotos: (id) => api(`/listings/${id}/photos`),
  getMine: () => api('/listings/me/mine', { auth: true }),
  create: (payload) => api('/listings', { method: 'POST', body: payload, auth: true }),
  addPhoto: (id, file, sortOrder = 0) => {
    const form = new FormData();
    form.append('photo', file);
    form.append('sortOrder', String(sortOrder));
    return api(`/listings/${id}/photos`, { method: 'POST', body: form, form: true, auth: true });
  },
  getPending: () => api('/listings/admin/pending', { auth: true }),
  approve: (id) => api(`/listings/${id}/approve`, { method: 'PATCH', auth: true }),
  reject: (id, rejectionReason) =>
    api(`/listings/${id}/reject`, { method: 'PATCH', body: { rejectionReason }, auth: true }),
};
