import { api } from './client';

export const subscriptionsApi = {
  // Initiate a subscription payment — sends MoMo push to user's phone
  // payload: { phone: string, plan: 'weekly' | 'monthly' }
  initiate: (payload) => api('/subscriptions/initiate', { method: 'POST', body: payload, auth: true }),

  // Get all subscriptions for the logged-in blocker
  getMine: () => api('/subscriptions/mine', { auth: true }),

  // Get current active subscription status
  getStatus: () => api('/subscriptions/status', { auth: true }),

  // Cancel a subscription by ID
  cancel: (id) => api(`/subscriptions/${id}/cancel`, { method: 'PATCH', auth: true }),
};
