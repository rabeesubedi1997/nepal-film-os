import api from '../api';

export const castCrewService = {
  // Get all cast and crew for a film
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/cast-crew`);
    return response.data;
  },

  // Create new cast/crew member
  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/cast-crew`, data);
    return response.data;
  },

  // Update cast/crew member
  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/cast-crew/${id}`, data);
    return response.data;
  },

  // Delete cast/crew member
  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/cast-crew/${id}`);
    return response.data;
  }
};
