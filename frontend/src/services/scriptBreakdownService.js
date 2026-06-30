import api from '../api';

export const scriptBreakdownService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/script-breakdown`);
    return response.data;
  },
  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/script-breakdown/${id}`);
    return response.data;
  },
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/script-breakdown`, data);
    return response.data;
  },
  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/script-breakdown/${id}`, data);
    return response.data;
  },
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/script-breakdown/${id}`);
    return response.data;
  },
};
