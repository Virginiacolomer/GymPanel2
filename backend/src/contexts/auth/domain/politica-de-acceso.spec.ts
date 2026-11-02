import { UserStatus } from '../../usuarios';
import { CuentaNoActivaError } from './errores-autenticacion';
import { asegurarQuePuedeIniciarSesion } from './politica-de-acceso';

describe('politica de acceso', () => {
  it('un usuario activo puede iniciar sesion', () => {
    expect(() =>
      asegurarQuePuedeIniciarSesion(UserStatus.ACTIVO),
    ).not.toThrow();
  });

  it.each([UserStatus.CREADO, UserStatus.INACTIVO])(
    'un usuario %s no puede iniciar sesion',
    (estado) => {
      expect(() => asegurarQuePuedeIniciarSesion(estado)).toThrow(
        CuentaNoActivaError,
      );
    },
  );
});
