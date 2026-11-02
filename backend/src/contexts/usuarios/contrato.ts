// Parte de la API publica sin frameworks: el puerto y los enums que otros
// contextos usan en su dominio y sus casos de uso. Se separa de index.ts porque
// ese archivo tambien exporta UsuariosModule y la entidad User, y cargarlo
// arrastra NestJS y TypeORM.
export {
  USUARIOS_QUERY,
  type UsuariosQuery,
  type UsuarioConCredenciales,
} from './application/puertos/usuarios.query';
export { UserRole } from './domain/value-objects/rol.vo';
export { UserStatus } from './domain/value-objects/estado-usuario.vo';
