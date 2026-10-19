import { api } from './client';

export const subscriptionsApi = {
  getMine: () => api('/subscriptions/me', { auth: true }),
  initiate: (payload) => api('/subscriptions/initiate', { method: 'POST', body: payload, auth: true }),
  confirm: (paymentId) => api('/subscriptions/confirm', { method: 'POST', body: { paymentId }, auth: true }),
};
