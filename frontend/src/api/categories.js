import { api } from './client';

export const categoriesApi = {
  getAll: (includeInactive = false) =>
    api(`/categories${includeInactive ? '?includeInactive=true' : ''}`),
  create: (payload) =>
    api('/categories', { method: 'POST', body: payload, auth: true }),
  update: (id, payload) =>
    api(`/categories/${id}`, { method: 'PATCH', body: payload, auth: true }),
  delete: (id) =>
    api(`/categories/${id}`, { method: 'DELETE', auth: true }),
  createSubtype: (categoryId, payload) =>
    api(`/categories/${categoryId}/subtypes`, { method: 'POST', body: payload, auth: true }),
  addSubtype: (categoryId, payload) =>
    api(`/categories/${categoryId}/subtypes`, { method: 'POST', body: payload, auth: true }),
  updateSubtype: (subtypeId, payload) =>
    api(`/categories/subtypes/${subtypeId}`, { method: 'PATCH', body: payload, auth: true }),
  deleteSubtype: (categoryIdOrSubtypeId, maybeSubtypeId) => {
    const subtypeId = maybeSubtypeId !== undefined ? maybeSubtypeId : categoryIdOrSubtypeId;
    return api(`/categories/subtypes/${subtypeId}`, { method: 'DELETE', auth: true });
  },
};
