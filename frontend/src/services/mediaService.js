import api from '../api';

export const mediaService = {
  fetch: async ({ type, page, perPage } = {}) => {
    const params = {};
    if (type) params.type = type;
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;
    const response = await api.get('/media', { params });
    return response.data;
  },
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/media/${id}`);
    return response.data;
  },
};
