import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

@Injectable({ providedIn: 'root' })
class AuthGuardService {
  private authStateService = inject(AuthStateService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authStateService.isLoggedIn();

    if (!isLoggedIn) {
      window.alert('Advertencia: debes iniciar sesion para acceder a esta pantalla.');
      this.router.navigate(['/login']);
      return false;
    }

    // Si la ruta requiere un rol específico, validar
    const requiredRole = route.data['role'];
    if (requiredRole) {
      const currentUser = this.authStateService.getCurrentUser();
      if (currentUser?.role !== requiredRole) {
        window.alert('Advertencia: tu rol no tiene permiso para acceder a esta pantalla.');
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  return inject(AuthGuardService).canActivate(route, state);
};
