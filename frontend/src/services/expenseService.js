import api from '../api';

export const expenseService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/expenses`);
    return response.data;
  },

  storeExpense: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/expenses`, data);
    return response.data;
  },

  updateExpense: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/expenses/${id}`, data);
    return response.data;
  },

  destroyExpense: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/expenses/${id}`);
    return response.data;
  },

  storeBudget: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/budgets`, data);
    return response.data;
  },

  destroyBudget: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/budgets/${id}`);
    return response.data;
  },

  approveExpense: async (filmId, id, payload) => {
    const response = await api.put(`/films/${filmId}/expenses/${id}/status`, payload);
    return response.data;
  },
};
