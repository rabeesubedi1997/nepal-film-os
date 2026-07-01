import { useAuthStore } from '../authStore';

export function usePermission() {
  const { currentFilm, userPermissions, userIsAdmin, user } = useAuthStore();

  const can = (permission) => {
    if (!currentFilm) return false;
    if (user?.is_super_admin) return true;
    if (userIsAdmin) return true;
    return userPermissions?.includes(permission) || false;
  };

  const canAny = (permissions) => {
    return permissions.some(can);
  };

  const canAll = (permissions) => {
    return permissions.every(can);
  };

  return { can, canAny, canAll, isAdmin: userIsAdmin || user?.is_super_admin };
}
