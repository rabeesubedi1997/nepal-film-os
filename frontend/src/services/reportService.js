import api from '../api';

export const reportService = {
  summary: async (filmId) => {
    const res = await api.get(`/films/${filmId}/reports/summary`);
    return res.data;
  },
};
