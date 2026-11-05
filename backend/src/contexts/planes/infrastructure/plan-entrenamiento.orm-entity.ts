import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// No declara la relacion inversa con User: la clave foranea la define
// User.planEntrenamiento (contexto Usuarios) y Planes accede a las asignaciones
// por el puerto AsignacionesDePlan. Sacarla no cambia el esquema.
@Entity({ name: 'plan_entrenamiento', schema: 'public' })
export class PlanEntrenamientoOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'varchar', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'predeterminado' })
  tipo!: 'predeterminado' | 'editado';

  @Column({ name: 'cantidad_dias', type: 'smallint', default: 7 })
  cantidadDias!: number;

  @Column({
    name: 'ejercicios',
    type: 'jsonb',
    default: () => "'[null,null,null,null,null,null,null]'::jsonb",
  })
  ejercicios!: Array<number[] | null>;

  @Column({
    name: 'repeticiones',
    type: 'jsonb',
    default: () => "'[null,null,null,null,null,null,null]'::jsonb",
  })
  repeticiones!: Array<string[] | null>;

  @Column({
    name: 'descripciones_dias',
    type: 'jsonb',
    nullable: true,
    default: () => "'[null,null,null,null,null,null,null]'::jsonb",
  })
  descripcionesDias!: Array<string | null> | null;
}
