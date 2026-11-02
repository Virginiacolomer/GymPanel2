import { UserStatus } from '../../usuarios';
import { CuentaNoActivaError } from './errores-autenticacion';

// Regla: solo un usuario ACTIVO puede iniciar sesion. Un usuario recien
// registrado queda CREADO hasta que un administrador lo activa.
export function asegurarQuePuedeIniciarSesion(estado: UserStatus): void {
  if (estado !== UserStatus.ACTIVO) {
    throw new CuentaNoActivaError();
  }
}
