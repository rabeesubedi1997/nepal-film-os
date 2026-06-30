import api from '../api';

export const messageService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/messages`);
    return response.data;
  },
  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/messages/${id}`);
    return response.data;
  },
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/messages`, data);
    return response.data;
  },
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/messages/${id}`);
    return response.data;
  },
  markRead: async (filmId, id) => {
    const response = await api.post(`/films/${filmId}/messages/${id}/read`);
    return response.data;
  },
};
