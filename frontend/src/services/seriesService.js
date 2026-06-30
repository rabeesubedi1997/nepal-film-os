import api from '../api';

export const seriesService = {
  index: async () => {
    const response = await api.get('/series');
    return response.data;
  },
  show: async (id) => {
    const response = await api.get(`/series/${id}`);
    return response.data;
  },
  store: async (data) => {
    const response = await api.post('/series', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/series/${id}`, data);
    return response.data;
  },
  destroy: async (id) => {
    const response = await api.delete(`/series/${id}`);
    return response.data;
  },
};
