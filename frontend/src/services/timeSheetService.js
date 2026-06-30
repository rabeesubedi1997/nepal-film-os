import api from '../api';

export const timeSheetService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/timesheets`);
    return response.data;
  },
  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/timesheets/${id}`);
    return response.data;
  },
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/timesheets`, data);
    return response.data;
  },
  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/timesheets/${id}`, data);
    return response.data;
  },
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/timesheets/${id}`);
    return response.data;
  },
  approve: async (filmId, id) => {
    const response = await api.put(`/films/${filmId}/timesheets/${id}/approve`);
    return response.data;
  },
  submit: async (filmId, id) => {
    const response = await api.put(`/films/${filmId}/timesheets/${id}/submit`);
    return response.data;
  },
  reject: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/timesheets/${id}/reject`, data);
    return response.data;
  },
};
