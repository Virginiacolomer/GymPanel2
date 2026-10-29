import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, Fixtures, PASSWORD } from './support/test-app';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let fx: Fixtures;
  let adminToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    fx = new Fixtures(app);
    adminToken = await fx.adminToken();
  });

  afterAll(async () => {
    await fx.cleanup();
    await app.close();
  });

  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  describe('POST /users (registro publico)', () => {
    it('crea un cliente en estado creado, con email en minusculas y sin password_hash', async () => {
      const email = fx.email('registro');
      const res = await fx
        .http()
        .post('/users')
        .send({
          email: email.toUpperCase(),
          nombre: 'Ana',
          apellido: 'Lopez',
          dni: '30111222',
          password: PASSWORD,
        })
        .expect(201);
      fx.trackUser(res.body.id);

      expect(res.body).toEqual({
        id: expect.any(Number),
        nombre: 'Ana',
        apellido: 'Lopez',
        dni: '30111222',
        email,
        role: 'CLIENTE',
        estado: 'creado',
        planEntrenamientoId: null,
      });
    });

    it('400 si el email trae espacios alrededor (lo rechaza @IsEmail)', async () => {
      const res = await fx
        .http()
        .post('/users')
        .send({
          email: `  ${fx.email('espacios')}  `,
          nombre: 'Ana',
          apellido: 'Lopez',
          dni: '1',
          password: PASSWORD,
        })
        .expect(400);
      expect(res.body.message).toEqual([
        'Ingresa un correo electronico valido.',
      ]);
    });

    it('409 si el email ya esta registrado', async () => {
      const cliente = await fx.createCliente('creado');
      return fx
        .http()
        .post('/users')
        .send({
          email: cliente.email,
          nombre: 'Otro',
          apellido: 'Usuario',
          dni: '1',
          password: PASSWORD,
        })
        .expect(409)
        .expect({
          message: 'El correo electronico ya esta registrado.',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('400 con los mensajes de validacion', async () => {
      const res = await fx.http().post('/users').send({}).expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'El correo electronico es obligatorio.',
          'El nombre es obligatorio.',
          'El apellido es obligatorio.',
          'El dni es obligatorio.',
          'La contrasena es obligatoria.',
        ]),
      );
    });
  });

  describe('consultas del admin', () => {
    it('GET /users lista usuarios sin password_hash', async () => {
      const cliente = await fx.createCliente('creado');
      const res = await fx.http().get('/users').set(auth()).expect(200);
      const fila = res.body.find((u: { id: number }) => u.id === cliente.id);
      expect(fila).toMatchObject({ id: cliente.id, email: cliente.email });
      expect(fila).not.toHaveProperty('password_hash');
    });

    it('GET /users/pendientes devuelve clientes en estado creado', async () => {
      const pendiente = await fx.createCliente('creado');
      const activo = await fx.createCliente('activo');
      const res = await fx
        .http()
        .get('/users/pendientes')
        .set(auth())
        .expect(200);

      expect(res.body).toContainEqual({
        id: pendiente.id,
        nombre: 'E2E',
        apellido: 'Cliente',
        dni: '12345678',
        estado: 'creado',
      });
      expect(res.body.map((u: { id: number }) => u.id)).not.toContain(
        activo.id,
      );
    });

    it('GET /users/clientes-activos devuelve solo datos del usuario', async () => {
      const activo = await fx.createCliente('activo');
      const res = await fx
        .http()
        .get('/users/clientes-activos')
        .set(auth())
        .expect(200);

      expect(res.body).toContainEqual({
        id: activo.id,
        nombre: 'E2E',
        apellido: 'Cliente',
        dni: '12345678',
        email: activo.email,
        estado: 'activo',
      });
    });

    it('GET /users/:id devuelve el usuario o 404', async () => {
      const cliente = await fx.createCliente('creado');
      const res = await fx
        .http()
        .get(`/users/${cliente.id}`)
        .set(auth())
        .expect(200);
      expect(res.body).toMatchObject({ id: cliente.id, estado: 'creado' });
      expect(res.body).not.toHaveProperty('password_hash');

      await fx.http().get('/users/999999999').set(auth()).expect(404).expect({
        message: 'No se encontro el usuario con id 999999999',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('PATCH /users/:id/estado', () => {
    it('activa al cliente y despues puede iniciar sesion', async () => {
      const cliente = await fx.createCliente('creado');
      const res = await fx
        .http()
        .patch(`/users/${cliente.id}/estado`)
        .set(auth())
        .send({ estado: 'activo' })
        .expect(200);
      expect(res.body).toMatchObject({ id: cliente.id, estado: 'activo' });
      expect(res.body).not.toHaveProperty('password_hash');

      await fx.login(cliente.email);
    });

    it('400 si el estado no es valido', async () => {
      const cliente = await fx.createCliente('creado');
      const res = await fx
        .http()
        .patch(`/users/${cliente.id}/estado`)
        .set(auth())
        .send({ estado: 'baneado' })
        .expect(400);
      expect(res.body.message).toEqual(['Estado invalido.']);
    });

    it('404 si el usuario no existe', () => {
      return fx
        .http()
        .patch('/users/999999999/estado')
        .set(auth())
        .send({ estado: 'activo' })
        .expect(404);
    });
  });

  describe('DELETE /users/:id', () => {
    it('elimina al usuario o devuelve 404', async () => {
      const cliente = await fx.createCliente('creado');
      await fx
        .http()
        .delete(`/users/${cliente.id}`)
        .set(auth())
        .expect(200)
        .expect({ message: 'Usuario eliminado correctamente.' });

      await fx
        .http()
        .delete(`/users/${cliente.id}`)
        .set(auth())
        .expect(404)
        .expect({
          message: `No se encontro el usuario con id ${cliente.id}`,
          error: 'Not Found',
          statusCode: 404,
        });
    });
  });

  it('las rutas de membresia y pago ya no existen', async () => {
    const cliente = await fx.createCliente('activo');
    await fx
      .http()
      .post(`/users/${cliente.id}/membresia`)
      .set(auth())
      .send({ membresiaId: 1 })
      .expect(404);
    await fx
      .http()
      .post(`/users/${cliente.id}/pago/al-dia`)
      .set(auth())
      .expect(404);
  });
});
