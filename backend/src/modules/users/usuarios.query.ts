import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';

// Puerto publico del contexto Usuarios: lo que otros contextos pueden
// consultar sin conocer su persistencia. Se inyecta con USUARIOS_QUERY.
// Por ahora lo usa Auth; cada metodo nuevo se agrega cuando un contexto lo
// necesite (Fase 2).
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
  // El email se busca tal cual: quien llama lo normaliza.
  buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null>;
}

export { UserRole, UserStatus };
