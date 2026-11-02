import { getRounds } from 'bcrypt';
import { BcryptHasherContrasenas } from './bcrypt-hasher-contrasenas';

describe('BcryptHasherContrasenas', () => {
  const hasher = new BcryptHasherContrasenas();
  const entorno = { ...process.env };

  afterEach(() => {
    process.env = { ...entorno };
  });

  it('el hash generado valida la contrasena correcta y no otra', async () => {
    process.env.BCRYPT_SALT_ROUNDS = '4';
    const hash = await hasher.hashear('secreto1');

    await expect(hasher.comparar('secreto1', hash)).resolves.toBe(true);
    await expect(hasher.comparar('otra', hash)).resolves.toBe(false);
  });

  it.each([
    ['production', undefined, 10],
    ['development', undefined, 8],
    ['development', '5', 5],
    ['development', '3', 8],
    ['production', 'abc', 10],
  ])(
    'con NODE_ENV=%s y BCRYPT_SALT_ROUNDS=%s usa %i rondas',
    async (nodeEnv, configuradas, esperadas) => {
      process.env.NODE_ENV = nodeEnv;
      if (configuradas === undefined) {
        delete process.env.BCRYPT_SALT_ROUNDS;
      } else {
        process.env.BCRYPT_SALT_ROUNDS = configuradas;
      }

      expect(getRounds(await hasher.hashear('secreto1'))).toBe(esperadas);
    },
  );
});
