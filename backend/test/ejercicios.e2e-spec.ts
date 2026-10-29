import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, Fixtures } from './support/test-app';

// PNG de 1x1 valido, para probar la subida de imagen sin pasar por Storage.
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('Ejercicios y grupos musculares (e2e)', () => {
  let app: INestApplication<App>;
  let fx: Fixtures;
  let adminToken: string;
  let clienteToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    fx = new Fixtures(app);
    adminToken = await fx.adminToken();
    const cliente = await fx.createCliente('activo');
    clienteToken = await fx.login(cliente.email);
  });

  afterAll(async () => {
    await fx.cleanup();
    await app.close();
  });

  const admin = () => ({ Authorization: `Bearer ${adminToken}` });
  const cliente = () => ({ Authorization: `Bearer ${clienteToken}` });

  describe('grupos musculares', () => {
    it('POST crea el grupo con el nombre normalizado en mayusculas', async () => {
      const nombre = fx.unique('  e2e   pecho ');
      const res = await fx
        .http()
        .post('/plan-entrenamiento/grupos-musculares')
        .set(admin())
        .send({ nombre })
        .expect(201);
      fx.trackGrupo(res.body.id);

      expect(res.body).toEqual({
        id: expect.any(Number),
        nombre: nombre.trim().replace(/\s+/g, ' ').toUpperCase(),
        message: 'Grupo muscular creado correctamente.',
      });
    });

    it('POST 409 si el nombre ya existe (sin distinguir mayusculas)', async () => {
      const grupo = await fx.createGrupo(adminToken);
      return fx
        .http()
        .post('/plan-entrenamiento/grupos-musculares')
        .set(admin())
        .send({ nombre: grupo.nombre.toLowerCase() })
        .expect(409)
        .expect({
          message: 'El grupo muscular ya existe y no se puede volver a crear.',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('POST 403 para un cliente', () => {
      return fx
        .http()
        .post('/plan-entrenamiento/grupos-musculares')
        .set(cliente())
        .send({ nombre: fx.unique('e2e') })
        .expect(403);
    });

    it('GET lista, resumen, por id y ejercicios del grupo (tambien para clientes)', async () => {
      const grupo = await fx.createGrupo(adminToken);
      const ejercicio = await fx.createEjercicio(adminToken, grupo.id);

      const lista = await fx
        .http()
        .get('/plan-entrenamiento/grupos-musculares')
        .set(cliente())
        .expect(200);
      expect(lista.body).toContainEqual({
        id: grupo.id,
        nombre: grupo.nombre,
        ejercicios: [
          { id: ejercicio.id, nombre: ejercicio.nombre, imagenUrl: null },
        ],
      });

      const resumen = await fx
        .http()
        .get('/plan-entrenamiento/grupos-musculares-resumen')
        .set(cliente())
        .expect(200);
      expect(resumen.body).toContainEqual({
        id: grupo.id,
        nombre: grupo.nombre,
      });

      await fx
        .http()
        .get(`/plan-entrenamiento/grupos-musculares/${grupo.id}`)
        .set(cliente())
        .expect(200)
        .expect({
          id: grupo.id,
          nombre: grupo.nombre,
          ejercicios: [
            { id: ejercicio.id, nombre: ejercicio.nombre, imagenUrl: null },
          ],
        });

      await fx
        .http()
        .get(`/plan-entrenamiento/grupos-musculares/${grupo.id}/ejercicios`)
        .set(cliente())
        .expect(200)
        .expect([
          { id: ejercicio.id, nombre: ejercicio.nombre, imagenUrl: null },
        ]);
    });

    it('GET por id 404 si no existe', () => {
      return fx
        .http()
        .get('/plan-entrenamiento/grupos-musculares/999999999')
        .set(admin())
        .expect(404)
        .expect({
          message: 'No se encontro el grupo muscular con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('PATCH renombra, 400 sin campos y 409 si choca con otro', async () => {
      const grupo = await fx.createGrupo(adminToken);
      const otro = await fx.createGrupo(adminToken);
      const nuevoNombre = fx.unique('e2e renombrado');

      await fx
        .http()
        .patch(`/plan-entrenamiento/grupos-musculares/${grupo.id}`)
        .set(admin())
        .send({ nombre: nuevoNombre })
        .expect(200)
        .expect({
          id: grupo.id,
          nombre: nuevoNombre.toUpperCase(),
          message: 'Grupo muscular actualizado correctamente.',
        });

      await fx
        .http()
        .patch(`/plan-entrenamiento/grupos-musculares/${grupo.id}`)
        .set(admin())
        .send({})
        .expect(400)
        .expect({
          message:
            'Debes enviar al menos un campo para actualizar el grupo muscular.',
          error: 'Bad Request',
          statusCode: 400,
        });

      await fx
        .http()
        .patch(`/plan-entrenamiento/grupos-musculares/${grupo.id}`)
        .set(admin())
        .send({ nombre: otro.nombre })
        .expect(409)
        .expect({
          message:
            'El grupo muscular ya existe y no se puede guardar con ese nombre.',
          error: 'Conflict',
          statusCode: 409,
        });
    });
  });

  describe('ejercicios', () => {
    it('POST crea el ejercicio normalizado', async () => {
      const grupo = await fx.createGrupo(adminToken);
      const nombre = fx.unique('e2e sentadilla');
      const res = await fx
        .http()
        .post('/plan-entrenamiento/ejercicios')
        .set(admin())
        .send({ nombre, grupoMuscularId: grupo.id })
        .expect(201);
      fx.trackEjercicio(res.body.id);

      expect(res.body).toEqual({
        id: expect.any(Number),
        nombre: nombre.toUpperCase(),
        grupoMuscularId: grupo.id,
        message: 'Ejercicio creado correctamente.',
      });
    });

    it('POST 404 si el grupo no existe y 409 si el nombre ya existe', async () => {
      await fx
        .http()
        .post('/plan-entrenamiento/ejercicios')
        .set(admin())
        .send({ nombre: fx.unique('e2e'), grupoMuscularId: 999999999 })
        .expect(404)
        .expect({
          message: 'No se encontro el grupo muscular con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });

      const grupo = await fx.createGrupo(adminToken);
      const ejercicio = await fx.createEjercicio(adminToken, grupo.id);
      await fx
        .http()
        .post('/plan-entrenamiento/ejercicios')
        .set(admin())
        .send({ nombre: ejercicio.nombre, grupoMuscularId: grupo.id })
        .expect(409)
        .expect({
          message: 'El ejercicio ya existe y no se puede volver a crear.',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('POST 400 con los mensajes de validacion', async () => {
      const res = await fx
        .http()
        .post('/plan-entrenamiento/ejercicios')
        .set(admin())
        .send({ nombre: '', grupoMuscularId: 0 })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'El nombre del ejercicio es obligatorio.',
          'El grupo muscular debe ser mayor a 0.',
        ]),
      );
    });

    it('GET por id devuelve el ejercicio o 404', async () => {
      const grupo = await fx.createGrupo(adminToken);
      const ejercicio = await fx.createEjercicio(adminToken, grupo.id);

      await fx
        .http()
        .get(`/plan-entrenamiento/ejercicios/${ejercicio.id}`)
        .set(admin())
        .expect(200)
        .expect({
          id: ejercicio.id,
          nombre: ejercicio.nombre,
          imagenUrl: null,
        });

      await fx
        .http()
        .get('/plan-entrenamiento/ejercicios/999999999')
        .set(admin())
        .expect(404)
        .expect({
          message: 'No se encontro el ejercicio con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('PATCH cambia nombre y grupo; 400 sin campos', async () => {
      const grupo = await fx.createGrupo(adminToken);
      const otroGrupo = await fx.createGrupo(adminToken);
      const ejercicio = await fx.createEjercicio(adminToken, grupo.id);
      const nuevoNombre = fx.unique('e2e editado');

      await fx
        .http()
        .patch(`/plan-entrenamiento/ejercicios/${ejercicio.id}`)
        .set(admin())
        .send({ nombre: nuevoNombre, grupoMuscularId: otroGrupo.id })
        .expect(200)
        .expect({
          id: ejercicio.id,
          nombre: nuevoNombre.toUpperCase(),
          grupoMuscularId: otroGrupo.id,
          message: 'Ejercicio actualizado correctamente.',
        });

      await fx
        .http()
        .patch(`/plan-entrenamiento/ejercicios/${ejercicio.id}`)
        .set(admin())
        .send({})
        .expect(400)
        .expect({
          message:
            'Debes enviar al menos un campo para actualizar el ejercicio.',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('DELETE elimina el ejercicio o devuelve 404', async () => {
      const grupo = await fx.createGrupo(adminToken);
      const ejercicio = await fx.createEjercicio(adminToken, grupo.id);

      await fx
        .http()
        .delete(`/plan-entrenamiento/ejercicios/${ejercicio.id}`)
        .set(admin())
        .expect(200)
        .expect({
          id: ejercicio.id,
          message: 'Ejercicio eliminado correctamente.',
        });

      await fx
        .http()
        .delete(`/plan-entrenamiento/ejercicios/${ejercicio.id}`)
        .set(admin())
        .expect(404);
    });

    // La subida exitosa llama a Supabase Storage (servicio externo) y no se
    // cubre aca; si se cubren las validaciones previas.
    it('POST imagen: 400 sin archivo o con tipo invalido, 404 si el ejercicio no existe', async () => {
      await fx
        .http()
        .post('/plan-entrenamiento/ejercicios/1/imagen')
        .set(admin())
        .expect(400);

      await fx
        .http()
        .post('/plan-entrenamiento/ejercicios/1/imagen')
        .set(admin())
        .attach('imagen', Buffer.from('hola'), {
          filename: 'nota.txt',
          contentType: 'text/plain',
        })
        .expect(400);

      await fx
        .http()
        .post('/plan-entrenamiento/ejercicios/999999999/imagen')
        .set(admin())
        .attach('imagen', PNG_1X1, {
          filename: 'imagen.png',
          contentType: 'image/png',
        })
        .expect(404)
        .expect({
          message: 'No se encontro el ejercicio con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });
    });
  });
});
