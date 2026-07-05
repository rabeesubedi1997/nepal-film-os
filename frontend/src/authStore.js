import { create } from 'zustand';
import api from './api';

const LAST_FILM_KEY = 'nepal_film_last_id';

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
      await get().fetchFilms();
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
      // Fetch films and auto-select if user has only one
      await get().fetchFilms();
      const { userFilms } = get();
      if (userFilms.length === 1) {
        await get().selectFilm(userFilms[0].id || userFilms[0].slug);
      }
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
    localStorage.removeItem(LAST_FILM_KEY);
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

  fetchFilms: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/films');
      set({ userFilms: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({ error: 'Failed to fetch film workspaces', loading: false });
      return [];
    }
  },

  selectFilm: async (filmIdOrSlug) => {
    set({ loading: true });
    try {
      const response = await api.get(`/films/${filmIdOrSlug}`);
      const film = response.data;
      localStorage.setItem(LAST_FILM_KEY, film.id);
      set({
        currentFilm: film,
        userRole: film.user_role,
        userDepartment: film.user_department,
        userRoleId: film.user_role_id,
        userPermissions: film.user_permissions || [],
        userIsAdmin: film.user_is_admin || false,
        loading: false,
      });
      return film;
    } catch (err) {
      set({ error: 'Failed to access film workspace', loading: false });
      return null;
    }
  },

  restoreLastFilm: async () => {
    const { token, user } = get();
    if (!token) return null;
    const lastId = localStorage.getItem(LAST_FILM_KEY);
    if (!lastId) return null;
    // If user not loaded yet, fetch them first
    if (!user) {
      const u = await get().fetchCurrentUser();
      if (!u) return null;
    }
    // Fetch films list (needed for sidebar dropdown etc.)
    const films = await get().fetchFilms();
    // Check if the last film still exists in user's films
    const stillExists = films?.some(f => String(f.id) === lastId || String(f.slug) === lastId);
    if (!stillExists) {
      localStorage.removeItem(LAST_FILM_KEY);
      return null;
    }
    return get().selectFilm(lastId);
  },

  toggleModule: async (moduleName, isEnabled) => {
    const { currentFilm } = get();
    if (!currentFilm) return;
    try {
      await api.put(`/films/${currentFilm.id}/features/toggle`, {
        module_name: moduleName,
        is_enabled: isEnabled,
      });
      await get().selectFilm(currentFilm.id);
    } catch (err) {
      set({ error: 'Failed to toggle module' });
    }
  },
}));
