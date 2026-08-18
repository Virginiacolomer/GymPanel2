import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);
  const token = authStateService.getToken();
  const isLoginRequest = /\/auth\/login(?:\?|$)/.test(request.url);
  const isPublicMembershipCatalogRequest =
    request.method === 'GET' && /\/membresia(?:\/tipos)?(?:\?|$)/.test(request.url);

  const requestWithAuth = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(requestWithAuth).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        if (isLoginRequest) {
          // En login dejamos que el componente muestre el mensaje especifico (ej. contrasena incorrecta).
          return throwError(() => error);
        }

        if (isPublicMembershipCatalogRequest) {
          return throwError(() => error);
        }

        window.alert('Advertencia: debes iniciar sesion para realizar esta accion.');
        authStateService.logout();
        router.navigate(['/login']);
      } else if (error?.status === 403) {
        if (isLoginRequest) {
          // En login dejamos que el componente muestre el mensaje especifico del backend.
          return throwError(() => error);
        }

        if (isPublicMembershipCatalogRequest) {
          return throwError(() => error);
        }

        window.alert('Advertencia: tu rol no tiene permiso para realizar esta accion.');

        const role = authStateService.getCurrentUser()?.role;
        if (role === 'ADMIN') {
          router.navigate(['/menu-admin']);
        } else if (role === 'CLIENTE') {
          router.navigate(['/menu-cliente']);
        } else if (role === 'SUPERADMIN') {
          router.navigate(['/superadmin/panel']);
        } else {
          router.navigate(['/']);
        }
      }

      return throwError(() => error);
    }),
  );
};
