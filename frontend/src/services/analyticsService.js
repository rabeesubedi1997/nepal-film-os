import api from '../api';

export const analyticsService = {
  overview: async (filmId) => {
    const res = await api.get(`/films/${filmId}/analytics/overview`);
    return res.data;
  },
  trends: async (filmId) => {
    const res = await api.get(`/films/${filmId}/analytics/trends`);
    return res.data;
  },
  forecasts: async (filmId) => {
    const res = await api.get(`/films/${filmId}/analytics/forecasts`);
    return res.data;
  },
};
