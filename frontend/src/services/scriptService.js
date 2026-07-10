import api from '../api';

export const scriptService = {
  index: (filmId) => api.get(`/films/${filmId}/scripts`),
  show: (filmId, id) => api.get(`/films/${filmId}/scripts/${id}`),
  store: (filmId, data) => api.post(`/films/${filmId}/scripts`, data),
  update: (filmId, id, data) => api.put(`/films/${filmId}/scripts/${id}`, data),
  destroy: (filmId, id) => api.delete(`/films/${filmId}/scripts/${id}`),
  extractScenes: (filmId, id) => api.post(`/films/${filmId}/scripts/${id}/extract-scenes`, { script_id: id }),

  versions: {
    index: (filmId, scriptId) => api.get(`/films/${filmId}/scripts/${scriptId}/versions`),
    create: (filmId, scriptId, description) => api.post(`/films/${filmId}/scripts/${scriptId}/versions`, { description }),
    restore: (filmId, scriptId, versionId) => api.post(`/films/${filmId}/scripts/${scriptId}/versions/${versionId}/restore`),
  },

  drafts: {
    index: (filmId, scriptId) => api.get(`/films/${filmId}/scripts/${scriptId}/drafts`),
    store: (filmId, scriptId, data) => api.post(`/films/${filmId}/scripts/${scriptId}/drafts`, data),
    update: (filmId, scriptId, draftId, data) => api.put(`/films/${filmId}/scripts/${scriptId}/drafts/${draftId}`, data),
    delete: (filmId, scriptId, draftId) => api.delete(`/films/${filmId}/scripts/${scriptId}/drafts/${draftId}`),
    archive: (filmId, scriptId, draftId) => api.post(`/films/${filmId}/scripts/${scriptId}/drafts/${draftId}/archive`),
  },

  scenes: {
    index: (filmId) => api.get(`/films/${filmId}/scenes`),
    show: (filmId, id) => api.get(`/films/${filmId}/scenes/${id}`),
    store: (filmId, data) => api.post(`/films/${filmId}/scenes`, data),
    update: (filmId, id, data) => api.put(`/films/${filmId}/scenes/${id}`, data),
    destroy: (filmId, id) => api.delete(`/films/${filmId}/scenes/${id}`),
    split: (filmId, id, newHeading) => api.post(`/films/${filmId}/scenes/${id}/split`, { new_heading: newHeading }),
    reorder: (filmId, order) => api.post(`/films/${filmId}/scenes/reorder`, { order }),
  },
};
