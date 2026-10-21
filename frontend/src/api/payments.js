import { api } from './client';

export const paymentsApi = {
  // Initiate a contact unlock — sends MoMo push to user's phone.
  // payload: { type: 'BLOCKER' | 'OWNER', phone: string }
  // Returns: { data: { payment: { id, status, ... } } }
  initiateUnlock: (listingId, payload) =>
    api(`/listings/${listingId}/contact/unlock`, { method: 'POST', body: payload, auth: true }),

  // Check if a contact has been revealed for a listing (call after MoMo payment completes).
  // Returns: { data: { blocker_phone, blocker_name, owner_phone, owner_name } } or null
  getRevealedContact: (listingId) =>
    api(`/listings/${listingId}/contact`, { auth: true }),

  // Get all contact unlocks for the logged-in user
  getMyUnlocks: () =>
    api('/contact-unlocks/mine', { auth: true }),
};
