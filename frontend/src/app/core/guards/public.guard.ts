import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

// Guard funcional: rutas publicas. Si el usuario esta logueado lo redirige a
// su menu, salvo que venga de un menu al inicio (en ese caso cierra sesion).
export const publicGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isLoggedIn()) {
    return true;
  }

  const targetPath = normalizePath(state.url);
  const forceLogoutFromMenu = route.queryParamMap.get('fromMenu') === '1';
  const isHomeTarget = targetPath === '/' || targetPath === '/inicio';

  const currentNavigation = router.getCurrentNavigation();
  const previousUrl = currentNavigation?.previousNavigation?.finalUrl?.toString() ?? '';
  const previousPath = normalizePath(previousUrl);
  const cameFromRoleMenu = previousPath === '/menu-admin' || previousPath === '/menu-cliente';

  // Solo cerramos sesion cuando se vuelve desde un menu al inicio.
  if ((isHomeTarget && cameFromRoleMenu) || (isHomeTarget && forceLogoutFromMenu)) {
    authState.logout();
    return true;
  }

  const role = authState.getCurrentUser()?.role;
  const fallbackRoute = role === 'ADMIN' ? '/menu-admin' : '/menu-cliente';
  router.navigate([fallbackRoute]);
  return false;
};

function normalizePath(url: string): string {
  const path = String(url ?? '').split('?')[0].trim();
  if (!path) {
    return '/';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

