import api from '../api';

export const newsService = {
  fetch: async ({ category, search, page, perPage } = {}) => {
    const params = {};
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    if (page) params.page = page;
    if (perPage) params.per_page = perPage;
    const response = await api.get('/news', { params });
    return response.data;
  },
  fetchOne: async (id) => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/news', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/news/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  },
  refresh: async () => {
    const response = await api.post('/news/refresh');
    return response.data;
  },
  fetchCategories: async () => {
    const response = await api.get('/news/categories');
    return response.data;
  },
  createCategory: async (data) => {
    const response = await api.post('/news/categories', data);
    return response.data;
  },
  updateCategory: async (id, data) => {
    const response = await api.put(`/news/categories/${id}`, data);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await api.delete(`/news/categories/${id}`);
    return response.data;
  },
};
