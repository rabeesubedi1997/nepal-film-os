import api from '../api';

export const dayOutOfDaysService = {
  index: async (filmId) => {
    const res = await api.get(`/films/${filmId}/day-out-of-days`);
    return res.data;
  },
  update: async (filmId, data) => {
    const res = await api.post(`/films/${filmId}/day-out-of-days`, data);
    return res.data;
  },
};
