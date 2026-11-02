import { Usuario } from '../../domain/usuario';
import { UserRole } from '../../domain/value-objects/rol.vo';
import { UserStatus } from '../../domain/value-objects/estado-usuario.vo';

export interface UsuarioRespuesta {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  role: UserRole;
  estado: UserStatus;
  planEntrenamientoId: number | null;
}

export function mapearAUsuarioRespuesta(usuario: Usuario): UsuarioRespuesta {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    dni: usuario.dni,
    email: usuario.email.valor,
    role: usuario.rol.valor,
    estado: usuario.estado.valor,
    planEntrenamientoId: usuario.planEntrenamientoId,
  };
}
