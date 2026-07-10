import api from '../api';

export const scriptCommentService = {
  index: (filmId, scriptId) => api.get(`/films/${filmId}/scripts/${scriptId}/comments`),
  show: (filmId, scriptId, id) => api.get(`/films/${filmId}/scripts/${scriptId}/comments/${id}`),
  store: (filmId, scriptId, data) => api.post(`/films/${filmId}/scripts/${scriptId}/comments`, data),
  update: (filmId, scriptId, id, data) => api.put(`/films/${filmId}/scripts/${scriptId}/comments/${id}`, data),
  destroy: (filmId, scriptId, id) => api.delete(`/films/${filmId}/scripts/${scriptId}/comments/${id}`),
  resolve: (filmId, scriptId, id) => api.post(`/films/${filmId}/scripts/${scriptId}/comments/${id}/resolve`),
  reopen: (filmId, scriptId, id) => api.post(`/films/${filmId}/scripts/${scriptId}/comments/${id}/reopen`),
};
