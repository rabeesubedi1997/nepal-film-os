import api from '../api';

export const locationService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/locations`);
    return response.data;
  },

  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/locations`, data);
    return response.data;
  },

  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/locations/${id}`);
    return response.data;
  },

  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/locations/${id}`, data);
    return response.data;
  },

  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/locations/${id}`);
    return response.data;
  },
};
