import { api } from './client';

export const locationsApi = {
  provinces: () => api('/location/provinces'),
  children: (id) => api(`/location/${id}/children`),
};
