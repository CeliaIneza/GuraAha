import { api } from './client';

export const subscriptionsApi = {
  // Initiate a subscription payment sends MoMo push to user's phone
  // payload: { phone: string, plan: 'weekly' | 'monthly' | 'vip_room_weekly' | ... }
  initiate: (payload) => api('/subscriptions/initiate', { method: 'POST', body: payload, auth: true }),

  // Get all subscriptions for the logged-in user
  getMine: () => api('/subscriptions/mine', { auth: true }),

  // Get current active subscription status (blocker + vip)
  getStatus: () => api('/subscriptions/status', { auth: true }),

  // Get VIP Room subscription status for the logged-in user
  getVipStatus: () => api('/subscriptions/vip-status', { auth: true }),

  // Get available subscription plans from settings
  getPlans: () => api('/subscriptions/plans'),

  // Cancel a subscription by ID
  cancel: (id) => api(`/subscriptions/${id}/cancel`, { method: 'PATCH', auth: true }),

};
