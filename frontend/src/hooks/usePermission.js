import { useCallback } from 'react';
import { useAuthStore } from '../authStore';

export function usePermission() {
  const { currentFilm, userPermissions, userIsAdmin, user, userFilms } = useAuthStore();

  const can = useCallback((permission) => {
    if (!currentFilm) return false;
    if (user?.is_super_admin === true || user?.is_super_admin === 1) return true;
    if (userIsAdmin) return true;
    return (userPermissions || []).includes(permission);
  }, [currentFilm, user?.is_super_admin, userIsAdmin, userPermissions]);

  const canAny = useCallback((permissions) => (permissions || []).some(can), [can]);

  const canAll = useCallback((permissions) => (permissions || []).every(can), [can]);

  const canView = useCallback((base) => can(`${base}.view`), [can]);
  const canCreate = useCallback((base) => can(`${base}.create`), [can]);
  const canEdit = useCallback((base) => can(`${base}.edit`), [can]);
  const canDelete = useCallback((base) => can(`${base}.delete`), [can]);

  const hasModule = useCallback((moduleKey) => {
    if (!currentFilm?.modules) return false;
    const mod = currentFilm.modules.find(m => m.module_name === moduleKey);
    return mod ? mod.is_enabled : false;
  }, [currentFilm?.modules]);

  const isSuperAdmin = user?.is_super_admin === true || user?.is_super_admin === 1;
  const isFilmAdmin = !!userIsAdmin;
  const isAdmin = isSuperAdmin || isFilmAdmin;

  const filmCount = userFilms?.length || 0;
  const hasMultipleFilms = filmCount > 1;

  return {
    can, canAny, canAll,
    canView, canCreate, canEdit, canDelete,
    hasModule,
    isSuperAdmin, isFilmAdmin, isAdmin,
    filmCount, hasMultipleFilms,
  };
}
