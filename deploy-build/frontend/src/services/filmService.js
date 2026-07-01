import api from '../api';

export const filmService = {
  inviteUser: (filmId, data) => api.post(`/films/${filmId}/invite`, data),
  getFilmUsers: (filmId) => api.get(`/films/${filmId}`),

  getMembers: (filmId) => api.get(`/films/${filmId}/members`),
  addMember: (filmId, data) => api.post(`/films/${filmId}/members`, data),
  updateMember: (filmId, userId, data) => api.put(`/films/${filmId}/members/${userId}`, data),
  removeMember: (filmId, userId) => api.delete(`/films/${filmId}/members/${userId}`),
};
