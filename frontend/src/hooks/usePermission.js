import { useAuthStore } from '../authStore';

export function usePermission() {
  const { currentFilm, userPermissions, userIsAdmin, user, userFilms } = useAuthStore();

  const can = (permission) => {
    if (!currentFilm) return false;
    if (user?.is_super_admin) return true;
    if (userIsAdmin) return true;
    return userPermissions?.includes(permission) || false;
  };

  const canAny = (permissions) => permissions.some(can);

  const canAll = (permissions) => permissions.every(can);

  const canView = (base) => can(`${base}.view`);
  const canCreate = (base) => can(`${base}.create`);
  const canEdit = (base) => can(`${base}.edit`);
  const canDelete = (base) => can(`${base}.delete`);

  const hasModule = (moduleKey) => {
    if (!currentFilm?.modules) return false;
    const mod = currentFilm.modules.find(m => m.module_name === moduleKey);
    return mod ? mod.is_enabled : false;
  };

  const isSuperAdmin = !!user?.is_super_admin;
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
