import { UserRole } from '../../domain/value-objects/rol.vo';
import { UserStatus } from '../../domain/value-objects/estado-usuario.vo';

export const USUARIOS_QUERY = Symbol('USUARIOS_QUERY');

export interface UsuarioConCredenciales {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  role: UserRole;
  estado: UserStatus;
  planEntrenamientoId: number | null;
  passwordHash: string;
}

export interface UsuariosQuery {
  buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null>;
}

export { UserRole, UserStatus };
