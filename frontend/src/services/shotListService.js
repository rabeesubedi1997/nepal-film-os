import api from '../api';

export const shotListService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/shot-list`);
    return response.data;
  },
  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/shot-list/${id}`);
    return response.data;
  },
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/shot-list`, data);
    return response.data;
  },
  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/shot-list/${id}`, data);
    return response.data;
  },
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/shot-list/${id}`);
    return response.data;
  },
};
