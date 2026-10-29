import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

export const PASSWORD = 'secreto1';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

// Los e2e corren contra una base compartida: cada test crea sus propios datos
// (emails @gympanel.test y nombres con un sufijo unico) y al final borra solo
// lo que creo, sin tocar el resto.
export class Fixtures {
  private readonly dataSource: DataSource;
  private readonly userIds: number[] = [];
  private readonly planIds: number[] = [];
  private readonly ejercicioIds: number[] = [];
  private readonly grupoIds: number[] = [];
  private counter = 0;
  readonly tag = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  constructor(private readonly app: INestApplication<App>) {
    this.dataSource = app.get(DataSource);
  }

  http() {
    return request(this.app.getHttpServer());
  }

  unique(prefix: string): string {
    this.counter += 1;
    return `${prefix} ${this.tag}-${this.counter}`;
  }

  email(prefix: string): string {
    this.counter += 1;
    return `e2e-${prefix}-${this.tag}-${this.counter}@gympanel.test`;
  }

  trackUser(id: number): void {
    this.userIds.push(id);
  }

  trackPlan(id: number): void {
    this.planIds.push(id);
  }

  trackEjercicio(id: number): void {
    this.ejercicioIds.push(id);
  }

  trackGrupo(id: number): void {
    this.grupoIds.push(id);
  }

  // No hay endpoint para crear administradores: se insertan directo.
  async createAdmin(): Promise<{ id: number; email: string }> {
    const email = this.email('admin');
    const hash = await bcrypt.hash(PASSWORD, 4);
    const rows: Array<{ id: number }> = await this.dataSource.query(
      `INSERT INTO "public"."user" (nombre, apellido, dni, email, password_hash, role, estado)
       VALUES ('E2E', 'Admin', '1', $1, $2, 'ADMIN', 'activo') RETURNING id`,
      [email, hash],
    );
    this.trackUser(rows[0].id);
    return { id: rows[0].id, email };
  }

  // Registra un cliente por la API y opcionalmente lo activa en la base.
  async createCliente(
    estado: 'creado' | 'activo' = 'activo',
  ): Promise<{ id: number; email: string }> {
    const email = this.email('cliente');
    const res = await this.http()
      .post('/users')
      .send({
        email,
        nombre: 'E2E',
        apellido: 'Cliente',
        dni: '12345678',
        password: PASSWORD,
      })
      .expect(201);
    const id = (res.body as { id: number }).id;
    this.trackUser(id);
    if (estado === 'activo') {
      await this.dataSource.query(
        `UPDATE "public"."user" SET estado = 'activo' WHERE id = $1`,
        [id],
      );
    }
    return { id, email };
  }

  async login(email: string): Promise<string> {
    const res = await this.http()
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(201);
    return (res.body as { accessToken: string }).accessToken;
  }

  async adminToken(): Promise<string> {
    const admin = await this.createAdmin();
    return this.login(admin.email);
  }

  async createGrupo(token: string): Promise<{ id: number; nombre: string }> {
    const res = await this.http()
      .post('/plan-entrenamiento/grupos-musculares')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: this.unique('e2e grupo') })
      .expect(201);
    const body = res.body as { id: number; nombre: string };
    this.trackGrupo(body.id);
    return body;
  }

  async createEjercicio(
    token: string,
    grupoMuscularId: number,
  ): Promise<{ id: number; nombre: string }> {
    const res = await this.http()
      .post('/plan-entrenamiento/ejercicios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: this.unique('e2e ejercicio'), grupoMuscularId })
      .expect(201);
    const body = res.body as { id: number; nombre: string };
    this.trackEjercicio(body.id);
    return body;
  }

  async createPlan(token: string, ejercicioId: number): Promise<number> {
    const res = await this.http()
      .post('/plan-entrenamiento')
      .set('Authorization', `Bearer ${token}`)
      .send(planBody(this.unique('e2e plan'), ejercicioId))
      .expect(201);
    const id = (res.body as { id: number }).id;
    this.trackPlan(id);
    return id;
  }

  async cleanup(): Promise<void> {
    if (this.userIds.length) {
      // Los planes editados del usuario se borran junto con el.
      const rows: Array<{ id: string }> = await this.dataSource.query(
        `SELECT plan_entrenamiento_id AS id FROM "public"."user"
         WHERE id = ANY($1) AND plan_entrenamiento_id IS NOT NULL`,
        [this.userIds],
      );
      rows.forEach((row) => this.planIds.push(Number(row.id)));
      await this.dataSource.query(
        `UPDATE "public"."user" SET plan_entrenamiento_id = NULL WHERE id = ANY($1)`,
        [this.userIds],
      );
      await this.dataSource.query(
        `DELETE FROM "public"."user" WHERE id = ANY($1)`,
        [this.userIds],
      );
    }
    if (this.planIds.length) {
      await this.dataSource.query(
        `DELETE FROM "public"."plan_entrenamiento" WHERE id = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "public"."user" u WHERE u.plan_entrenamiento_id = plan_entrenamiento.id)`,
        [this.planIds],
      );
    }
    if (this.ejercicioIds.length) {
      await this.dataSource.query(
        `DELETE FROM "public"."ejercicio" WHERE id = ANY($1)`,
        [this.ejercicioIds],
      );
    }
    if (this.grupoIds.length) {
      await this.dataSource.query(
        `DELETE FROM "public"."grupoMuscular" WHERE id = ANY($1)`,
        [this.grupoIds],
      );
    }
  }
}

// Plan de un solo dia con un ejercicio; el resto de la semana en null.
export function planBody(nombre: string, ejercicioId: number) {
  return {
    nombre,
    descripcion: 'Plan de prueba',
    cantidadDias: 1,
    ejercicios: [[ejercicioId], null, null, null, null, null, null],
    repeticiones: [['4x10'], null, null, null, null, null, null],
  };
}
