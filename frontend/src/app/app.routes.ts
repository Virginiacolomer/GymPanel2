import { Routes } from '@angular/router';
import { PaginaInicio } from './pages/pagina-inicio/pagina-inicio';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { MenuAdmin } from './pages/menu-admin/menu-admin';
import { MenuCliente } from './pages/menu-cliente/menu-cliente';
import { GestionUsuarios } from './pages/gestion-usuarios/gestion-usuarios';
import { AltaUsuarios } from './pages/alta-usuarios/alta-usuarios';
import { AsignarPlan } from './pages/asignar-plan/asignar-plan';
import { CrearPlan } from './pages/crear-plan/crear-plan';
import { CrearEjercicios } from './pages/crear-ejercicios/crear-ejercicios';
import { EditarPlan } from './pages/editar-plan/editar-plan';
import { VerPlan } from './pages/ver-plan/ver-plan';
import { MiPlan } from './pages/mi-plan/mi-plan';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

// Configuracion de rutas de toda la aplicacion.
export const routes: Routes = [
	// Rutas publicas: al acceder, si el usuario estaba logueado se cierra su sesion automaticamente.
	{ path: '', component: PaginaInicio, canActivate: [publicGuard] },
	{ path: 'inicio', component: PaginaInicio, canActivate: [publicGuard] },
	{ path: 'login', component: Login, canActivate: [publicGuard] },
	{ path: 'register', component: Register, canActivate: [publicGuard] },
	// Rutas exclusivas para ADMIN.
	{ path: 'menu-admin', component: MenuAdmin, canActivate: [authGuard], data: { role: 'ADMIN' } },
	{
		path: 'gestion-usuarios',
		component: GestionUsuarios,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},
	{
		path: 'alta-usuarios',
		component: AltaUsuarios,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},
	{
		path: 'asignar-plan',
		component: AsignarPlan,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},
	{
		path: 'crear-plan',
		component: CrearPlan,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},
	{
		path: 'crear-ejercicios',
		component: CrearEjercicios,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},
	{
		path: 'editar-plan',
		component: EditarPlan,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},
	{
		path: 'ver-plan',
		component: VerPlan,
		canActivate: [authGuard],
		data: { role: 'ADMIN' },
	},

	// Rutas exclusivas para CLIENTE.
	{ path: 'menu-cliente', component: MenuCliente, canActivate: [authGuard], data: { role: 'CLIENTE' } },
	{ path: 'mi-plan', component: MiPlan, canActivate: [authGuard], data: { role: 'CLIENTE' } },

	// Comodin: cualquier URL no existente redirige al home.
	{ path: '**', redirectTo: '' },
];
