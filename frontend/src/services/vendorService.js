import api from '../api';

export const vendorService = {
  index: async (filmId) => {
    const res = await api.get(`/films/${filmId}/vendors`);
    return res.data;
  },
  store: async (filmId, data) => {
    const res = await api.post(`/films/${filmId}/vendors`, data);
    return res.data;
  },
  update: async (filmId, id, data) => {
    const res = await api.put(`/films/${filmId}/vendors/${id}`, data);
    return res.data;
  },
  destroy: async (filmId, id) => {
    const res = await api.delete(`/films/${filmId}/vendors/${id}`);
    return res.data;
  },
};
