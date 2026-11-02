import { Usuario } from './usuario';
import { Email } from './value-objects/email.vo';
import { EstadoUsuario, UserStatus } from './value-objects/estado-usuario.vo';
import { Rol, UserRole } from './value-objects/rol.vo';
import { ReglaDeNegocioError } from '../../../shared/domain/domain-error';

describe('Dominio de Usuario', () => {
  describe('Email Value Object', () => {
    it('normaliza a minusculas y elimina espacios en blanco', () => {
      const email = Email.crear('  Ana.Lopez@EJEMPLO.com  ');
      expect(email.valor).toBe('ana.lopez@ejemplo.com');
    });

    it('falla si el email no tiene @', () => {
      expect(() => Email.crear('email-invalido')).toThrow(ReglaDeNegocioError);
    });

    it('falla si el email es vacio', () => {
      expect(() => Email.crear('')).toThrow(ReglaDeNegocioError);
    });
  });

  describe('Rol Value Object', () => {
    it('crea rol CLIENTE por defecto o fabrica', () => {
      const rol = Rol.cliente();
      expect(rol.valor).toBe(UserRole.CLIENTE);
      expect(rol.esCliente()).toBe(true);
      expect(rol.esAdmin()).toBe(false);
    });

    it('crea rol ADMIN', () => {
      const rol = Rol.admin();
      expect(rol.valor).toBe(UserRole.ADMIN);
      expect(rol.esAdmin()).toBe(true);
      expect(rol.esCliente()).toBe(false);
    });

    it('falla ante un rol inexistente', () => {
      expect(() => Rol.crear('SUPERADMIN')).toThrow(ReglaDeNegocioError);
    });
  });

  describe('EstadoUsuario Value Object', () => {
    it('soporta creado, activo e inactivo', () => {
      expect(EstadoUsuario.creado().valor).toBe(UserStatus.CREADO);
      expect(EstadoUsuario.activo().valor).toBe(UserStatus.ACTIVO);
      expect(EstadoUsuario.inactivo().valor).toBe(UserStatus.INACTIVO);
    });

    it('normaliza mayusculas y espacios al crear', () => {
      const estado = EstadoUsuario.crear('  ACTIVO ');
      expect(estado.esActivo()).toBe(true);
    });

    it('falla ante un estado no reconocido', () => {
      expect(() => EstadoUsuario.crear('baneado')).toThrow(ReglaDeNegocioError);
    });
  });

  describe('Entidad Usuario', () => {
    const crearUsuarioPrueba = () =>
      Usuario.nuevo({
        nombre: 'Carlos',
        apellido: 'Gomez',
        dni: '35123456',
        email: Email.crear('carlos@gym.com'),
        passwordHash: 'hash-secreto-123',
      });

    it('se crea por defecto como CLIENTE y CREADO', () => {
      const usuario = crearUsuarioPrueba();
      expect(usuario.nombre).toBe('Carlos');
      expect(usuario.apellido).toBe('Gomez');
      expect(usuario.email.valor).toBe('carlos@gym.com');
      expect(usuario.rol.esCliente()).toBe(true);
      expect(usuario.estado.esCreado()).toBe(true);
      expect(usuario.planEntrenamientoId).toBeNull();
    });

    it('permite activar al usuario', () => {
      const usuario = crearUsuarioPrueba();
      usuario.activar();
      expect(usuario.estado.esActivo()).toBe(true);
    });

    it('permite desactivar al usuario', () => {
      const usuario = crearUsuarioPrueba();
      usuario.desactivar();
      expect(usuario.estado.esInactivo()).toBe(true);
    });

    it('permite asignar y desasignar plan de entrenamiento', () => {
      const usuario = crearUsuarioPrueba();
      usuario.asignarPlan(10);
      expect(usuario.planEntrenamientoId).toBe(10);

      usuario.desasignarPlan();
      expect(usuario.planEntrenamientoId).toBeNull();
    });

    it('reconstituye un usuario con id existente', () => {
      const usuario = Usuario.reconstituir({
        id: 42,
        nombre: 'Maria',
        apellido: 'Perez',
        dni: '40987654',
        email: Email.crear('maria@gym.com'),
        passwordHash: 'hash456',
        rol: Rol.admin(),
        estado: EstadoUsuario.activo(),
        planEntrenamientoId: 5,
      });

      expect(usuario.id).toBe(42);
      expect(usuario.rol.esAdmin()).toBe(true);
      expect(usuario.estado.esActivo()).toBe(true);
      expect(usuario.planEntrenamientoId).toBe(5);
    });
  });
});
