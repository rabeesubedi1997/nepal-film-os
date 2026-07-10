import api from '../api';

export const beatSheetService = {
  index: (filmId) => api.get(`/films/${filmId}/beat-sheets`),
  show: (filmId, id) => api.get(`/films/${filmId}/beat-sheets/${id}`),
  store: (filmId, data) => api.post(`/films/${filmId}/beat-sheets`, data),
  update: (filmId, id, data) => api.put(`/films/${filmId}/beat-sheets/${id}`, data),
  destroy: (filmId, id) => api.delete(`/films/${filmId}/beat-sheets/${id}`),
  storeBeat: (filmId, sheetId, data) => api.post(`/films/${filmId}/beat-sheets/${sheetId}/beats`, data),
  updateBeat: (filmId, sheetId, beatId, data) => api.put(`/films/${filmId}/beat-sheets/${sheetId}/beats/${beatId}`, data),
  destroyBeat: (filmId, sheetId, beatId) => api.delete(`/films/${filmId}/beat-sheets/${sheetId}/beats/${beatId}`),
  reorderBeats: (filmId, sheetId, beats) => api.post(`/films/${filmId}/beat-sheets/${sheetId}/beats/reorder`, { beats }),
};
