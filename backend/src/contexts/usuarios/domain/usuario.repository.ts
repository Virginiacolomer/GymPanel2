import { Usuario } from './usuario';
import { Email } from './value-objects/email.vo';

export interface UsuarioRepository {
  guardar(usuario: Usuario): Promise<Usuario>;
  buscarPorId(id: number): Promise<Usuario | null>;
  buscarPorEmail(email: Email): Promise<Usuario | null>;
  buscarPendientes(): Promise<Usuario[]>;
  buscarClientesActivos(): Promise<Usuario[]>;
  buscarTodos(): Promise<Usuario[]>;
  eliminar(id: number): Promise<boolean>;
}

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');
