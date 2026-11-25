import { api } from './client';

export const adminApi = {
  getAllBlockers: (params = {}) => {
    const qs = new URLSearchParams({ limit: '100', ...params }).toString();
    return api(`/admin/blockers?${qs}`, { auth: true });
  },
  getBlockerHistory: () => api('/admin/blockers/history?limit=100', { auth: true }),
  getAllListings: (params = {}) => {
    const qs = new URLSearchParams({ limit: '100', ...params }).toString();
    return api(`/admin/listings?${qs}`, { auth: true });
  },
  getListingHistory: () => api('/admin/listings/history?limit=100', { auth: true }),
  getAllSubscriptions: (params = {}) => {
    const qs = new URLSearchParams({ limit: '100', ...params }).toString();
    return api(`/admin/subscriptions?${qs}`, { auth: true });
  },
  saveSubscriber: (payload) =>
    api('/admin/subscriptions/save', { method: 'POST', body: payload, auth: true }),
  extendSubscription: (id) =>
    api(`/admin/subscriptions/${id}/extend`, { method: 'PATCH', auth: true }),
  toggleCancelSubscription: (id) =>
    api(`/admin/subscriptions/${id}/toggle-cancel`, { method: 'PATCH', auth: true }),
  deleteSubscription: (id) =>
    api(`/admin/subscriptions/${id}`, { method: 'DELETE', auth: true }),

  saveVipPromotion: (payload) =>
    api('/admin/vip-promotions', { method: 'POST', body: payload, auth: true }),
  endVipPromotion: (id) =>
    api(`/admin/vip-promotions/${id}/end`, { method: 'POST', auth: true }),
  sendVipAlert: (id) =>
    api(`/admin/vip-promotions/${id}/alert`, { method: 'POST', auth: true }),

  getPayments: () => api('/admin/payments', { auth: true }),
  getAllPayments: () => api('/admin/payments', { auth: true }),
  refundPayment: (id) =>
    api(`/admin/payments/${id}/refund`, { method: 'POST', auth: true }),
  recheckPayment: (id) =>
    api(`/admin/payments/${id}/recheck`, { method: 'POST', auth: true }),

  getAuditLogs: () => api('/admin/audit-logs', { auth: true }),

  createPartner: (payload) =>
    api('/partners', { method: 'POST', body: payload, auth: true }),
  updatePartner: (id, payload) =>
    api(`/partners/${id}`, { method: 'PATCH', body: payload, auth: true }),
  deletePartner: (id) =>
    api(`/partners/${id}`, { method: 'DELETE', auth: true }),

  reviseBlocker: (id, adminNote) =>
    api(`/blockers/applications/${id}/revise`, {
      method: 'PATCH',
      body: { adminNote },
      auth: true,
    }),
  reviseListing: (id, adminNote) =>
    api(`/listings/${id}/revise`, {
      method: 'PATCH',
      body: { adminNote },
      auth: true,
    }),
};
