import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { GimnasioApiService } from '../services/gimnasio-api.service';

// Bloquea la ruta si el plan del gimnasio no incluye la funcionalidad
// indicada en route.data['feature']. Siempre consulta el estado real del
// gimnasio (nunca confia en datos guardados en el navegador), asi que
// escribir la URL a mano no alcanza para saltear un plan que no la incluye
// -- el backend igual la rechazaria, pero esto evita que se llegue a ver
// la pantalla.
export const featureGuard: CanActivateFn = (route) => {
  const requiredFeature = route.data['feature'] as string | undefined;

  if (!requiredFeature) {
    return true;
  }

  const gimnasioApiService = inject(GimnasioApiService);
  const router = inject(Router);

  return gimnasioApiService.getMiGimnasio().pipe(
    map((contacto) => {
      if (contacto.funcionalidades.includes(requiredFeature)) {
        return true;
      }

      window.alert('Esta funcionalidad no esta incluida en el plan de tu gimnasio.');
      router.navigate(['/menu-admin']);
      return false;
    }),
    catchError(() => {
      window.alert('No se pudo verificar el plan de tu gimnasio. Intenta de nuevo.');
      router.navigate(['/menu-admin']);
      return of(false);
    }),
  );
};
