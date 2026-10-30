import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EjercicioOrmEntity } from './ejercicio.orm-entity';

@Entity({ name: 'grupoMuscular', schema: 'public' })
export class GrupoMuscularOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @OneToMany(
    () => EjercicioOrmEntity,
    (ejercicio: EjercicioOrmEntity) => ejercicio.grupoMuscular,
  )
  ejercicios!: EjercicioOrmEntity[];
}

export { GrupoMuscularOrmEntity as GrupoMuscular };
