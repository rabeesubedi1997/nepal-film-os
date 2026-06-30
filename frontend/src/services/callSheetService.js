import api from '../api';

export const callSheetService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/call-sheets`);
    return response.data;
  },

  show: async (filmId, id) => {
    const response = await api.get(`/films/${filmId}/call-sheets/${id}`);
    return response.data;
  },

  store: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/call-sheets`, data);
    return response.data;
  },

  update: async (filmId, id, data) => {
    const response = await api.put(`/films/${filmId}/call-sheets/${id}`, data);
    return response.data;
  },

  destroy: async (filmId, id) => {
    const response = await api.delete(`/films/${filmId}/call-sheets/${id}`);
    return response.data;
  },

  acknowledge: async (filmId, entryId) => {
    const response = await api.post(`/films/${filmId}/call-sheet-entries/${entryId}/acknowledge`);
    return response.data;
  },

  distribute: async (filmId, id) => {
    const res = await api.post(`/films/${filmId}/call-sheets/${id}/distribute`);
    return res.data;
  },

  exportPdf: async (filmId, id) => {
    try {
      const response = await api.get(`/films/${filmId}/call-sheets/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = response.data;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `call-sheet-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF.');
    }
  },
};
