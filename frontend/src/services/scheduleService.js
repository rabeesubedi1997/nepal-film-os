import api from '../api';

export const scheduleService = {
  index: async (filmId) => {
    const response = await api.get(`/films/${filmId}/schedules`);
    return response.data;
  },

  storeSchedule: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/schedules`, data);
    return response.data;
  },

  updateSchedule: async (filmId, scheduleId, data) => {
    const response = await api.put(`/films/${filmId}/schedules/${scheduleId}`, data);
    return response.data;
  },

  destroySchedule: async (filmId, scheduleId) => {
    const response = await api.delete(`/films/${filmId}/schedules/${scheduleId}`);
    return response.data;
  },

  storeScene: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/scenes`, data);
    return response.data;
  },

  updateScene: async (filmId, sceneId, data) => {
    const response = await api.put(`/films/${filmId}/scenes/${sceneId}`, data);
    return response.data;
  },

  destroyScene: async (filmId, sceneId) => {
    const response = await api.delete(`/films/${filmId}/scenes/${sceneId}`);
    return response.data;
  },

  addSceneToSchedule: async (filmId, data) => {
    const response = await api.post(`/films/${filmId}/schedules/sync-scenes`, data);
    return response.data;
  },

  exportPdf: async (filmId, scheduleId) => {
    try {
      const response = await api.get(`/films/${filmId}/schedules/${scheduleId}/pdf`, {
        responseType: 'blob',
      });
      const blob = response.data;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `schedule-day-${scheduleId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Check console for details.');
    }
  },
};
