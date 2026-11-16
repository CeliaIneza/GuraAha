import { api } from './client';

export const notificationsApi = {
  // GET /notifications fetch paginated notifications + unread count
  getMine: (params = {}) => {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return api(`/notifications${qs ? `?${qs}` : ''}`, { auth: true });
  },

  // GET /notifications/unread-count
  getUnreadCount: () => api('/notifications/unread-count', { auth: true }),

  // PATCH /notifications/mark-all-read
  markAllRead: () => api('/notifications/mark-all-read', { method: 'PATCH', auth: true }),

  // PATCH /notifications/:id/read
  markRead: (id) => api(`/notifications/${id}/read`, { method: 'PATCH', auth: true }),
};
