import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GrupoMuscularOrmEntity } from './grupo-muscular.orm-entity';

@Entity({ name: 'ejercicio', schema: 'public' })
export class EjercicioOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl!: string | null;

  @ManyToOne(
    () => GrupoMuscularOrmEntity,
    (grupoMuscular: GrupoMuscularOrmEntity) => grupoMuscular.ejercicios,
  )
  @JoinColumn({ name: 'grupoMuscularId' })
  grupoMuscular!: GrupoMuscularOrmEntity;

  @Column({ name: 'grupoMuscularId', type: 'integer', nullable: true })
  grupoMuscularId!: number | null;
}

export { EjercicioOrmEntity as Ejercicio };
