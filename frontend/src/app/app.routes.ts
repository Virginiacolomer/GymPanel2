import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

// Configuracion de rutas centralizadas de toda la aplicacion con lazy loading.
export const routes: Routes = [
  // Rutas publicas
  {
    path: '',
    loadComponent: () =>
      import('./pages/pagina-inicio/pagina-inicio').then((m) => m.PaginaInicio),
    canActivate: [publicGuard],
  },
  {
    path: 'inicio',
    loadComponent: () =>
      import('./pages/pagina-inicio/pagina-inicio').then((m) => m.PaginaInicio),
    canActivate: [publicGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [publicGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    canActivate: [publicGuard],
  },

  // Rutas exclusivas para ADMIN
  {
    path: 'menu-admin',
    loadComponent: () => import('./pages/menu-admin/menu-admin').then((m) => m.MenuAdmin),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'gestion-usuarios',
    loadComponent: () =>
      import('./pages/gestion-usuarios/gestion-usuarios').then((m) => m.GestionUsuarios),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'alta-usuarios',
    loadComponent: () =>
      import('./pages/alta-usuarios/alta-usuarios').then((m) => m.AltaUsuarios),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'asignar-plan',
    loadComponent: () =>
      import('./pages/asignar-plan/asignar-plan').then((m) => m.AsignarPlan),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'crear-plan',
    loadComponent: () =>
      import('./pages/crear-plan/crear-plan').then((m) => m.CrearPlan),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'crear-ejercicios',
    loadComponent: () =>
      import('./pages/crear-ejercicios/crear-ejercicios').then((m) => m.CrearEjercicios),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'editar-plan',
    loadComponent: () =>
      import('./pages/editar-plan/editar-plan').then((m) => m.EditarPlan),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },
  {
    path: 'ver-plan',
    loadComponent: () =>
      import('./pages/ver-plan/ver-plan').then((m) => m.VerPlan),
    canActivate: [authGuard],
    data: { role: 'ADMIN' },
  },

  // Rutas exclusivas para CLIENTE
  {
    path: 'menu-cliente',
    loadComponent: () =>
      import('./pages/menu-cliente/menu-cliente').then((m) => m.MenuCliente),
    canActivate: [authGuard],
    data: { role: 'CLIENTE' },
  },
  {
    path: 'mi-plan',
    loadComponent: () => import('./pages/mi-plan/mi-plan').then((m) => m.MiPlan),
    canActivate: [authGuard],
    data: { role: 'CLIENTE' },
  },

  // Comodin: cualquier URL no existente redirige al home
  { path: '**', redirectTo: '' },
];
