import { create } from 'zustand';
import api from './api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nepal_film_token') || null,
  currentFilm: null,
  userRole: null,
  userDepartment: null,
  userRoleId: null,
  userPermissions: [],
  userIsAdmin: false,
  userFilms: [],
  loading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('nepal_film_token', token);
    } else {
      localStorage.removeItem('nepal_film_token');
    }
    set({ token });
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/register', userData);
      const { user, token } = response.data;
      get().setToken(token);
      set({ user, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/login', { email, password });
      const { user, token } = response.data;
      get().setToken(token);
      set({ user, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    get().setToken(null);
    set({ user: null, currentFilm: null, userRole: null, userRoleId: null, userPermissions: [], userIsAdmin: false, userFilms: [] });
  },

  fetchCurrentUser: async () => {
    if (!get().token) return null;
    set({ loading: true });
    try {
      const response = await api.get('/me');
      set({ user: response.data, loading: false });
      return response.data;
    } catch (err) {
      get().setToken(null);
      set({ user: null, loading: false });
      return null;
    }
  },

  fetchUserFilms: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/films');
      set({ userFilms: response.data, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch film workspaces', loading: false });
    }
  },

  selectFilm: async (filmIdOrSlug) => {
    set({ loading: true });
    try {
      const response = await api.get(`/films/${filmIdOrSlug}`);
      const film = response.data;
      set({
        currentFilm: film,
        userRole: film.user_role,
        userDepartment: film.user_department,
        userRoleId: film.user_role_id,
        userPermissions: film.user_permissions || [],
        userIsAdmin: film.user_is_admin || false,
        loading: false
      });
      return film;
    } catch (err) {
      set({ error: 'Failed to access film workspace', loading: false });
      return null;
    }
  },

  toggleModule: async (moduleName, isEnabled) => {
    const { currentFilm } = get();
    if (!currentFilm) return;
    try {
      await api.put(`/films/${currentFilm.id}/modules`, {
        module_name: moduleName,
        is_enabled: isEnabled
      });
      // Refresh current film
      await get().selectFilm(currentFilm.id);
    } catch (err) {
      set({ error: 'Failed to toggle module' });
    }
  }
}));
