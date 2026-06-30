import api from '../api';

export const progressService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/progress`);
    return response.data;
  },

  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/progress`, data);
    return response.data;
  },

  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/progress/${id}`, data);
    return response.data;
  },

  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/progress/${id}`);
    return response.data;
  },
};
