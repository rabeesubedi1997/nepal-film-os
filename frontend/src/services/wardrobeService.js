import api from '../api';

export const wardrobeService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/wardrobe`);
    return response.data;
  },
  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/wardrobe/${id}`);
    return response.data;
  },
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/wardrobe`, data);
    return response.data;
  },
  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/wardrobe/${id}`, data);
    return response.data;
  },
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/wardrobe/${id}`);
    return response.data;
  },
};
