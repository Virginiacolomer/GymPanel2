import { Usuario } from '../../domain/usuario';
import { Email } from '../../domain/value-objects/email.vo';
import { EstadoUsuario } from '../../domain/value-objects/estado-usuario.vo';
import { Rol } from '../../domain/value-objects/rol.vo';
import { User } from '../entities/user.entity';

export class UsuarioOrmMapper {
  static toDomain(orm: User): Usuario {
    return Usuario.reconstituir({
      id: orm.id,
      nombre: orm.nombre,
      apellido: orm.apellido,
      dni: orm.dni,
      email: Email.crear(orm.email),
      passwordHash: orm.password_hash,
      rol: Rol.crear(orm.role),
      estado: EstadoUsuario.crear(orm.estado),
      planEntrenamientoId: orm.planEntrenamientoId ?? null,
    });
  }

  static toOrm(domain: Usuario): User {
    const orm = new User();
    if (domain.id > 0) {
      orm.id = domain.id;
    }
    orm.nombre = domain.nombre;
    orm.apellido = domain.apellido;
    orm.dni = domain.dni;
    orm.email = domain.email.valor;
    orm.password_hash = domain.passwordHash;
    orm.role = domain.rol.valor;
    orm.estado = domain.estado.valor;
    orm.planEntrenamientoId = domain.planEntrenamientoId;
    return orm;
  }
}
