import { PlanEntrenamiento } from '../../../../modules/plan-entrenamiento/entities/plan-entrenamiento.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../../domain/value-objects/rol.vo';
import { UserStatus } from '../../domain/value-objects/estado-usuario.vo';

@Entity({ name: 'user', schema: 'public' })
// El email es unico en todo el sistema (restriccion, no regla de negocio).
@Index('uq_user_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column()
  dni!: string;

  @Column()
  email!: string;

  @Column({ name: 'password_hash' })
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 20, default: UserStatus.CREADO })
  estado!: UserStatus;

  @Column({ name: 'plan_entrenamiento_id', type: 'int', nullable: true })
  planEntrenamientoId!: number | null;

  @ManyToOne(() => PlanEntrenamiento, { nullable: true })
  @JoinColumn({ name: 'plan_entrenamiento_id' })
  planEntrenamiento!: PlanEntrenamiento | null;
}
