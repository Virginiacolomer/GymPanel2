import { ConfigService } from '@nestjs/config';
import { resolverSecretoJwt } from './secreto-jwt';

// Doble: el ConfigService real lee primero process.env, y el CI define
// JWT_SECRET.
function configuracion(valores: Record<string, string>) {
  return {
    get: (clave: string) => valores[clave],
  } as unknown as ConfigService;
}

describe('resolverSecretoJwt', () => {
  it('usa JWT_SECRET cuando esta definido', () => {
    expect(
      resolverSecretoJwt(
        configuracion({ JWT_SECRET: 'propio', NODE_ENV: 'production' }),
      ),
    ).toBe('propio');
  });

  it('en desarrollo usa el valor por defecto si falta', () => {
    expect(resolverSecretoJwt(configuracion({ NODE_ENV: 'development' }))).toBe(
      'gympanel-dev-secret',
    );
  });

  it.each([[{}], [{ JWT_SECRET: '' }]])(
    'en produccion falla si falta o esta vacio (%j)',
    (valores) => {
      expect(() =>
        resolverSecretoJwt(
          configuracion({ ...valores, NODE_ENV: 'production' }),
        ),
      ).toThrow('Falta la variable de entorno JWT_SECRET.');
    },
  );
});
