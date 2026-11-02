// API publica del contexto Usuarios: lo unico que otros contextos pueden importar.
// La regla de ESLint de fronteras prohibe importar sus capas internas.
export { UsuariosModule } from './usuarios.module';
export {
  USUARIOS_QUERY,
  type UsuariosQuery,
  type UsuarioConCredenciales,
} from './application/puertos/usuarios.query';
export { UserRole } from './domain/value-objects/rol.vo';
export { UserStatus } from './domain/value-objects/estado-usuario.vo';
export { Usuario } from './domain/usuario';
export {
  USUARIO_REPOSITORY,
  type UsuarioRepository,
} from './domain/usuario.repository';
// Exportada para compatibilidad de persistencia con el modulo de planes hasta su refactor
export { User } from './infrastructure/entities/user.entity';
