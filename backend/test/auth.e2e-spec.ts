import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, Fixtures, PASSWORD } from './support/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let fx: Fixtures;

  beforeAll(async () => {
    app = await createTestApp();
    fx = new Fixtures(app);
  });

  afterAll(async () => {
    await fx.cleanup();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('devuelve token y usuario sin password_hash', async () => {
      const cliente = await fx.createCliente('activo');

      const res = await fx
        .http()
        .post('/auth/login')
        .send({ email: cliente.email.toUpperCase(), password: PASSWORD })
        .expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user).toEqual({
        id: cliente.id,
        nombre: 'E2E',
        apellido: 'Cliente',
        dni: '12345678',
        email: cliente.email,
        role: 'CLIENTE',
        estado: 'activo',
        planEntrenamientoId: null,
      });

      const payload = JSON.parse(
        Buffer.from(res.body.accessToken.split('.')[1], 'base64url').toString(),
      );
      expect(payload).toMatchObject({
        sub: cliente.id,
        email: cliente.email,
        role: 'CLIENTE',
      });
      expect(payload).not.toHaveProperty('gimnasioId');
    });

    it('404 si el email no esta registrado', () => {
      return fx
        .http()
        .post('/auth/login')
        .send({ email: fx.email('nadie'), password: PASSWORD })
        .expect(404)
        .expect({
          message: 'El correo electronico no esta registrado.',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('401 si la contrasena es incorrecta', async () => {
      const cliente = await fx.createCliente('activo');
      return fx
        .http()
        .post('/auth/login')
        .send({ email: cliente.email, password: 'otraclave' })
        .expect(401)
        .expect({
          message: 'La contrasena es incorrecta.',
          error: 'Unauthorized',
          statusCode: 401,
        });
    });

    it('403 si la cuenta todavia no esta activa', async () => {
      const cliente = await fx.createCliente('creado');
      return fx
        .http()
        .post('/auth/login')
        .send({ email: cliente.email, password: PASSWORD })
        .expect(403)
        .expect({
          message: 'Espera que tu entrenador habilite tu cuenta!',
          error: 'Forbidden',
          statusCode: 403,
        });
    });

    it('400 con los mensajes de validacion', async () => {
      const res = await fx
        .http()
        .post('/auth/login')
        .send({ email: 'no-es-email', password: '123' })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'Ingresa un correo electronico valido.',
          'La contrasena debe tener al menos 6 caracteres.',
        ]),
      );
    });

    it('400 si se envia gimnasioId (ya no existe)', async () => {
      const res = await fx
        .http()
        .post('/auth/login')
        .send({ gimnasioId: 1, email: fx.email('x'), password: PASSWORD })
        .expect(400);
      expect(res.body.message).toEqual([
        'property gimnasioId should not exist',
      ]);
    });
  });

  describe('guards', () => {
    it('401 sin token', () => {
      return fx.http().get('/users').expect(401).expect({
        message: 'Token no provisto.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('401 con token invalido', () => {
      return fx
        .http()
        .get('/users')
        .set('Authorization', 'Bearer token-trucho')
        .expect(401)
        .expect({
          message: 'Token invalido o expirado.',
          error: 'Unauthorized',
          statusCode: 401,
        });
    });

    it('403 si el rol no corresponde', async () => {
      const cliente = await fx.createCliente('activo');
      const token = await fx.login(cliente.email);
      return fx
        .http()
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect({
          message: 'No tienes permisos para realizar esta accion.',
          error: 'Forbidden',
          statusCode: 403,
        });
    });
  });
});
