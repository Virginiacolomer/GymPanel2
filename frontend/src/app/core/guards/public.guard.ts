import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

@Injectable({ providedIn: 'root' })
class PublicGuardService {
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authStateService.isLoggedIn()) {
      return true;
    }

    const targetPath = this.normalizePath(state.url);
    const forceLogoutFromMenu = route.queryParamMap.get('fromMenu') === '1';
    const isHomeTarget = targetPath === '/' || targetPath === '/inicio';

    const currentNavigation = this.router.getCurrentNavigation();
    const previousUrl = currentNavigation?.previousNavigation?.finalUrl?.toString() ?? '';
    const previousPath = this.normalizePath(previousUrl);
    const cameFromRoleMenu = previousPath === '/menu-admin' || previousPath === '/menu-cliente';

    // Solo cerramos sesion cuando se vuelve desde un menu al inicio.
    if ((isHomeTarget && cameFromRoleMenu) || (isHomeTarget && forceLogoutFromMenu)) {
      this.authStateService.logout();
      return true;
    }

    const role = this.authStateService.getCurrentUser()?.role;
    const fallbackRoute = role === 'ADMIN' ? '/menu-admin' : '/menu-cliente';
    this.router.navigate([fallbackRoute]);
    return false;
  }

  private normalizePath(url: string): string {
    const path = String(url ?? '').split('?')[0].trim();
    if (!path) {
      return '/';
    }
    return path.startsWith('/') ? path : `/${path}`;
  }
}

export const publicGuard: CanActivateFn = (route, state) => {
  return inject(PublicGuardService).canActivate(route, state);
};
