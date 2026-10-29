import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp, Fixtures, planBody } from './support/test-app';

describe('Planes de entrenamiento (e2e)', () => {
  let app: INestApplication<App>;
  let fx: Fixtures;
  let adminToken: string;
  let ejercicioId: number;

  beforeAll(async () => {
    app = await createTestApp();
    fx = new Fixtures(app);
    adminToken = await fx.adminToken();
    const grupo = await fx.createGrupo(adminToken);
    ejercicioId = (await fx.createEjercicio(adminToken, grupo.id)).id;
  });

  afterAll(async () => {
    await fx.cleanup();
    await app.close();
  });

  const admin = () => ({ Authorization: `Bearer ${adminToken}` });

  describe('CRUD de planes predeterminados', () => {
    it('POST crea el plan', async () => {
      const res = await fx
        .http()
        .post('/plan-entrenamiento')
        .set(admin())
        .send(planBody(fx.unique('e2e plan'), ejercicioId))
        .expect(201);
      fx.trackPlan(res.body.id);

      expect(res.body).toEqual({
        id: expect.any(Number),
        message: 'Plan de entrenamiento creado correctamente',
      });
    });

    it('POST 400 si un dia fuera de cantidadDias no es null', () => {
      const body = planBody(fx.unique('e2e plan'), ejercicioId);
      body.ejercicios[1] = [ejercicioId];
      body.repeticiones[1] = ['3x8'];
      return fx
        .http()
        .post('/plan-entrenamiento')
        .set(admin())
        .send(body)
        .expect(400)
        .expect({
          message:
            'El dia 2 debe enviarse como null porque excede la cantidad de dias configurada.',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('POST 400 si ejercicios y repeticiones no coinciden', () => {
      const body = planBody(fx.unique('e2e plan'), ejercicioId);
      body.repeticiones[0] = ['4x10', '3x8'];
      return fx
        .http()
        .post('/plan-entrenamiento')
        .set(admin())
        .send(body)
        .expect(400)
        .expect({
          message:
            'El dia 1 debe tener la misma cantidad de ejercicios y repeticiones.',
          error: 'Bad Request',
          statusCode: 400,
        });
    });

    it('POST 400 con los mensajes de validacion del DTO', async () => {
      const res = await fx
        .http()
        .post('/plan-entrenamiento')
        .set(admin())
        .send({ nombre: '', cantidadDias: 8, ejercicios: [], repeticiones: [] })
        .expect(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'El nombre del plan es obligatorio.',
          'La cantidad de dias no puede ser mayor a 7.',
          'El arreglo de ejercicios debe tener 7 posiciones.',
          'El arreglo de repeticiones debe tener 7 posiciones.',
        ]),
      );
    });

    it('GET lista los predeterminados con el formato de respuesta', async () => {
      const nombre = fx.unique('e2e plan');
      const planId = await createPlanNamed(nombre);

      const res = await fx
        .http()
        .get('/plan-entrenamiento')
        .set(admin())
        .expect(200);
      const plan = res.body.find(
        (p: { id: string | number }) => Number(p.id) === planId,
      );

      expect(plan).toEqual({
        id: String(planId),
        nombre,
        descripcion: 'Plan de prueba',
        tipo: 'predeterminado',
        cantidadDias: 1,
        ejercicios: [[ejercicioId], null, null, null, null, null, null],
        repeticiones: [['4x10'], null, null, null, null, null, null],
        descripcionesDias: null,
        descripciones_dias: null,
        ejerciciosVisibles: [[ejercicioId]],
        repeticionesVisibles: [['4x10']],
      });
    });

    it('GET /:id devuelve el plan o 404', async () => {
      const planId = await createPlanNamed(fx.unique('e2e plan'));
      const res = await fx
        .http()
        .get(`/plan-entrenamiento/${planId}`)
        .set(admin())
        .expect(200);
      expect(res.body).toMatchObject({
        id: String(planId),
        tipo: 'predeterminado',
      });

      await fx
        .http()
        .get('/plan-entrenamiento/999999999')
        .set(admin())
        .expect(404)
        .expect({
          message: 'No se encontro el plan de entrenamiento con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('PATCH /:id actualiza y devuelve el plan formateado', async () => {
      const planId = await createPlanNamed(fx.unique('e2e plan'));
      const nuevoNombre = fx.unique('e2e plan editado');
      const res = await fx
        .http()
        .patch(`/plan-entrenamiento/${planId}`)
        .set(admin())
        .send({ nombre: nuevoNombre, descripcion: '' })
        .expect(200);

      expect(res.body).toMatchObject({
        id: String(planId),
        nombre: nuevoNombre,
        descripcion: null,
        ejerciciosVisibles: [[ejercicioId]],
      });
    });

    it('DELETE 400 para un plan predeterminado y 404 si no existe', async () => {
      const planId = await createPlanNamed(fx.unique('e2e plan'));
      await fx
        .http()
        .delete(`/plan-entrenamiento/${planId}`)
        .set(admin())
        .expect(400)
        .expect({
          message: 'Los planes predeterminados no se pueden eliminar.',
          error: 'Bad Request',
          statusCode: 400,
        });

      await fx
        .http()
        .delete('/plan-entrenamiento/999999999')
        .set(admin())
        .expect(404);
    });
  });

  describe('asignacion y plan del cliente', () => {
    it('el cliente sin plan recibe plan null', async () => {
      const cliente = await fx.createCliente('activo');
      const token = await fx.login(cliente.email);
      await fx
        .http()
        .get('/plan-entrenamiento/mio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect({ userId: cliente.id, planEntrenamientoId: null, plan: null });
    });

    it('asignar, consultar, editar para el usuario y reasignar', async () => {
      const cliente = await fx.createCliente('activo');
      const token = await fx.login(cliente.email);
      const nombre = fx.unique('e2e plan');
      const planId = await createPlanNamed(nombre);

      await fx
        .http()
        .patch(`/plan-entrenamiento/usuario/${cliente.id}/asignar/${planId}`)
        .set(admin())
        .expect(200)
        .expect({ message: 'Plan asignado correctamente' });

      const mio = await fx
        .http()
        .get('/plan-entrenamiento/mio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(mio.body).toMatchObject({
        userId: cliente.id,
        planEntrenamientoId: String(planId),
        plan: { id: String(planId), nombre },
      });

      const delAdmin = await fx
        .http()
        .get(`/plan-entrenamiento/usuario/${cliente.id}`)
        .set(admin())
        .expect(200);
      expect(delAdmin.body).toMatchObject({ plan: { id: String(planId) } });

      // Editar para el usuario crea una copia "editado" y se la asigna.
      const editado = await fx
        .http()
        .patch(`/plan-entrenamiento/usuario/${cliente.id}/editar`)
        .set(admin())
        .send(planBody(fx.unique('e2e personalizado'), ejercicioId))
        .expect(200);
      expect(editado.body).toEqual({
        id: expect.any(Number),
        tipo: 'editado',
        message: 'Plan personalizado del usuario actualizado correctamente',
      });
      const editadoId = editado.body.id as number;
      fx.trackPlan(editadoId);

      const mioEditado = await fx
        .http()
        .get('/plan-entrenamiento/mio')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(mioEditado.body.plan).toMatchObject({
        id: String(editadoId),
        tipo: 'editado',
      });

      // Un editado asignado no se puede borrar.
      await fx
        .http()
        .delete(`/plan-entrenamiento/${editadoId}`)
        .set(admin())
        .expect(400)
        .expect({
          message:
            'No se puede eliminar un plan editado que esta asignado a usuarios.',
          error: 'Bad Request',
          statusCode: 400,
        });

      // Los editados no aparecen en el listado de predeterminados.
      const lista = await fx
        .http()
        .get('/plan-entrenamiento')
        .set(admin())
        .expect(200);
      expect(lista.body.map((p: { id: string }) => Number(p.id))).not.toContain(
        editadoId,
      );

      // Al reasignar un predeterminado, el editado que quedo sin uso se borra.
      await fx
        .http()
        .patch(`/plan-entrenamiento/usuario/${cliente.id}/asignar/${planId}`)
        .set(admin())
        .expect(200);
      await fx
        .http()
        .get(`/plan-entrenamiento/${editadoId}`)
        .set(admin())
        .expect(404);
    });

    it('asignar 404 si el plan o el usuario no existen', async () => {
      const cliente = await fx.createCliente('activo');
      await fx
        .http()
        .patch(`/plan-entrenamiento/usuario/${cliente.id}/asignar/999999999`)
        .set(admin())
        .expect(404)
        .expect({
          message: 'No se encontro el plan de entrenamiento con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });

      const planId = await createPlanNamed(fx.unique('e2e plan'));
      await fx
        .http()
        .patch(`/plan-entrenamiento/usuario/999999999/asignar/${planId}`)
        .set(admin())
        .expect(404)
        .expect({
          message: 'No se encontro el usuario con id 999999999',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('GET usuario/:userId 404 si el usuario no existe', () => {
      return fx
        .http()
        .get('/plan-entrenamiento/usuario/999999999')
        .set(admin())
        .expect(404);
    });

    it('un admin no puede usar /mio (solo CLIENTE)', () => {
      return fx.http().get('/plan-entrenamiento/mio').set(admin()).expect(403);
    });
  });

  async function createPlanNamed(nombre: string): Promise<number> {
    const res = await fx
      .http()
      .post('/plan-entrenamiento')
      .set(admin())
      .send(planBody(nombre, ejercicioId))
      .expect(201);
    fx.trackPlan(res.body.id);
    return res.body.id as number;
  }
});
