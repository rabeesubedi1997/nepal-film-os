import api from '../api';

export const filmService = {
  inviteUser: (filmId, data) => api.post(`/films/${filmId}/invite`, data),
  getFilmUsers: (filmId) => api.get(`/films/${filmId}`),
};
