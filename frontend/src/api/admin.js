import { api } from './client';

export const adminApi = {
  // All records (any status)
  getAllBlockers: () => api('/admin/blockers', { auth: true }),
  getAllListings: () => api('/admin/listings', { auth: true }),
  getAllSubscriptions: () => api('/admin/subscriptions', { auth: true }),

  // History (non-pending only)
  getBlockerHistory: () => api('/admin/blockers/history', { auth: true }),
  getListingHistory: () => api('/admin/listings/history', { auth: true }),

  // Actions
  reviseBlocker: (id, adminNote) =>
    api(`/blockers/applications/${id}/revise`, { method: 'PATCH', body: { adminNote }, auth: true }),
  reviseListing: (id, adminNote) =>
    api(`/listings/${id}/revise`, { method: 'PATCH', body: { adminNote }, auth: true }),

  // Partners CRUD
  createPartner: (payload) => api('/partners', { method: 'POST', body: payload, auth: true }),
  updatePartner: (id, payload) => api(`/partners/${id}`, { method: 'PATCH', body: payload, auth: true }),
  deletePartner: (id) => api(`/partners/${id}`, { method: 'DELETE', auth: true }),
};
