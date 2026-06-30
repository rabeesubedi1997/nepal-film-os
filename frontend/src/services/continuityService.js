import api from '../api';

export const continuityService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/continuity`);
    return response.data;
  },
  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/continuity/${id}`);
    return response.data;
  },
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/continuity`, data);
    return response.data;
  },
  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/continuity/${id}`, data);
    return response.data;
  },
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/continuity/${id}`);
    return response.data;
  },
};
