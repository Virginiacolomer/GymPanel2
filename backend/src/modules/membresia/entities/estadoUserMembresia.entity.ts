import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { UserMembresia } from './userMembresia.entity';

// Tabla global compartida entre todos los gimnasios: son solo dos filas
// fijas (PENDIENTE_PAGO / AL_DIA) referenciadas por nombre en el codigo,
// no dato propio de cada gimnasio.
@Entity({ name: 'estadoUserMembresia', schema: 'public' })
export class EstadoUserMembresia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  nombre!: string;

  @OneToMany(() => UserMembresia, (userMembresia: UserMembresia) => userMembresia.estado)
  userMembresias!: UserMembresia[];
}
