import { MigrationInterface, QueryRunner } from 'typeorm';

// Fase 0: borra lo que quedo fuera del alcance del producto (membresias,
// pagos, gimnasio/multisucursal, horarios, superadmin y la tabla plan_dia sin
// uso). Tambien deja el email como unico en todo el sistema.
//
// Es idempotente: en una base nueva no hay nada que borrar. En una base que
// nunca se sincronizo con el codigo nuevo, ademas saca las columnas
// gimnasio_id que quedaron en las tablas que se mantienen.
//
// Irreversible: los datos borrados no se pueden reconstruir.
export class DropRemovedFeatures1761700000001 implements MigrationInterface {
  name = 'DropRemovedFeatures1761700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'pago',
      'user_membresia',
      'estadoUserMembresia',
      'membresia',
      'horario',
      'superadmin',
      'plan_dia',
    ]) {
      await queryRunner.query(
        `DROP TABLE IF EXISTS "public"."${table}" CASCADE`,
      );
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."uq_user_gimnasio_email"`,
    );
    for (const table of [
      'user',
      'ejercicio',
      'grupoMuscular',
      'plan_entrenamiento',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "public"."${table}" DROP COLUMN IF EXISTS "gimnasio_id"`,
      );
    }

    await queryRunner.query(`DROP TABLE IF EXISTS "public"."gimnasio" CASCADE`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."gimnasio_plan_enum"`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_email" ON "public"."user" ("email")`,
    );
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error(
        'DropRemovedFeatures es irreversible: los datos de membresias, pagos, gimnasios, horarios y superadmin no se pueden recuperar.',
      ),
    );
  }
}
