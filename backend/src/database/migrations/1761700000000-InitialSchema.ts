import { MigrationInterface, QueryRunner } from 'typeorm';

// Esquema base despues de la limpieza de la Fase 0 (usuarios, planes,
// ejercicios y grupos musculares). Es idempotente (IF NOT EXISTS) para poder
// correrlo tanto en una base vacia como en la base que ya venia creada por
// synchronize. Los nombres de PK/FK son los que habia generado TypeORM, asi un
// migration:generate posterior no detecta diferencias falsas.
export class InitialSchema1761700000000 implements MigrationInterface {
  name = 'InitialSchema1761700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."user_role_enum" AS ENUM ('CLIENTE', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."grupoMuscular" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        CONSTRAINT "PK_4af916a0ad682d55e30c05505e6" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."ejercicio" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "imagen_url" character varying(500),
        "grupoMuscularId" integer,
        CONSTRAINT "PK_09160ab0efc6c5440304e762d2c" PRIMARY KEY ("id"),
        CONSTRAINT "FK_c5a49d6a5556caaa1849fef10cd" FOREIGN KEY ("grupoMuscularId")
          REFERENCES "public"."grupoMuscular"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."plan_entrenamiento" (
        "id" BIGSERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "descripcion" character varying,
        "tipo" character varying(20) NOT NULL DEFAULT 'predeterminado',
        "cantidad_dias" smallint NOT NULL DEFAULT '7',
        "ejercicios" jsonb NOT NULL DEFAULT '[null,null,null,null,null,null,null]'::jsonb,
        "repeticiones" jsonb NOT NULL DEFAULT '[null,null,null,null,null,null,null]'::jsonb,
        "descripciones_dias" jsonb DEFAULT '[null,null,null,null,null,null,null]'::jsonb,
        CONSTRAINT "PK_51ea0c7689730dd370ae64752f0" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."user" (
        "id" SERIAL NOT NULL,
        "nombre" character varying NOT NULL,
        "apellido" character varying NOT NULL,
        "dni" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'CLIENTE',
        "estado" character varying(20) NOT NULL DEFAULT 'creado',
        "plan_entrenamiento_id" bigint,
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"),
        CONSTRAINT "FK_c1b807612f6f6b5901495ef9b65" FOREIGN KEY ("plan_entrenamiento_id")
          REFERENCES "public"."plan_entrenamiento"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."user"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "public"."plan_entrenamiento"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."ejercicio"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."grupoMuscular"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
  }
}
