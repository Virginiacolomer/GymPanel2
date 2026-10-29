import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

// Guard funcional: protege rutas que requieren autenticacion y rol especifico.
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isLoggedIn()) {
    window.alert('Advertencia: debes iniciar sesion para acceder a esta pantalla.');
    router.navigate(['/login']);
    return false;
  }

  const requiredRole = route.data['role'] as string | undefined;
  if (requiredRole && authState.getCurrentUser()?.role !== requiredRole) {
    window.alert('Advertencia: tu rol no tiene permiso para acceder a esta pantalla.');
    router.navigate(['/']);
    return false;
  }

  return true;
};

