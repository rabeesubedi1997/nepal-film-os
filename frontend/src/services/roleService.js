import api from '../api';

export const roleService = {
  getAll: (filmId) => api.get(`/films/${filmId}/roles`),
  get: (filmId, roleId) => api.get(`/films/${filmId}/roles/${roleId}`),
  create: (filmId, data) => api.post(`/films/${filmId}/roles`, data),
  update: (filmId, roleId, data) => api.put(`/films/${filmId}/roles/${roleId}`, data),
  destroy: (filmId, roleId) => api.delete(`/films/${filmId}/roles/${roleId}`),
  availablePermissions: () => api.get('/permissions/list'),
};
