import { api } from './client';

export const paymentsApi = {
  initiateUnlock: (payload) =>
    api('/payments/unlocks/initiate', { method: 'POST', body: payload, auth: true }),

  confirmUnlock: (paymentId) =>
    api('/payments/unlocks/confirm', { method: 'POST', body: { paymentId }, auth: true }),

  getMyUnlocks: (listingId) =>
    api(`/payments/unlocks/me${listingId ? `?listingId=${listingId}` : ''}`, { auth: true }),
};
