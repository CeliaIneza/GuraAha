import { api } from './client';

export const locationsApi = {
  provinces: () => api('/location/provinces'),
  children: (parentId) => api(`/location/${parentId}/children`),
  getAreaHighlights: () => api('/location/area-highlights'),
  upsertAreaHighlight: (districtName, payload) =>
    api(`/location/area-highlights/${encodeURIComponent(districtName)}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    }),
  updateAreaHighlight: (districtName, payload) =>
    api(`/location/area-highlights/${encodeURIComponent(districtName)}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    }),
  addDistrict: (province, name) =>
    api('/location/districts', {
      method: 'POST',
      body: { province, name },
      auth: true,
    }),
};
