import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { PlanGimnasio } from '../enums/plan-gimnasio.enum';

// Un Gimnasio es un tenant: cada usuario, membresia y plan de entrenamiento
// pertenece a exactamente uno. Es lo que permite que una sola base de datos
// sirva a muchos gimnasios sin que se mezclen los datos entre si.
@Entity({ name: 'gimnasio', schema: 'public' })
export class Gimnasio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  // Identificador estable y url-friendly, usado por el selector de gimnasio
  // en login/registro (no expone el id numerico interno).
  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'varchar', nullable: true })
  instagram!: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefono!: string | null;

  @Column({ type: 'varchar', nullable: true })
  direccion!: string | null;

  // Permite desactivar un gimnasio (por ejemplo si deja de pagar el servicio)
  // sin borrar sus datos. Un gimnasio inactivo no aparece en el selector y
  // sus usuarios no pueden iniciar sesion.
  @Column({ default: true })
  activo!: boolean;

  // Determina que funcionalidades del panel de administrador tiene
  // habilitadas este gimnasio (ver funcionalidades.ts). Solo lo administra
  // el SUPERADMIN de la plataforma, nunca el propio gimnasio.
  @Column({ type: 'enum', enum: PlanGimnasio, default: PlanGimnasio.BASICO })
  plan!: PlanGimnasio;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
