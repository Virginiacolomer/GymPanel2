import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { GrupoMuscular } from './grupoMuscular.entity';

@Entity({ name: 'ejercicio', schema: 'public' })
export class Ejercicio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagenUrl!: string | null;

  @ManyToOne(
    () => GrupoMuscular,
    (grupoMuscular: GrupoMuscular) => grupoMuscular.ejercicios,
  )
  grupoMuscular!: GrupoMuscular;
}
