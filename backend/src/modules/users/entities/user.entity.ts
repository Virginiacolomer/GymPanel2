import { Membresia } from '../../membresia/entities/membresia.entity';
import { Pago } from '../../membresia/entities/pago.entity';
import { UserMembresia } from '../../membresia/entities/userMembresia.entity';
import { PlanEntrenamiento } from '../../plan-entrenamiento/entities/plan-entrenamiento.entity';
import { Gimnasio } from '../../gimnasio/entities/gimnasio.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

@Entity({ name: 'user', schema: 'public' })
// El email es unico por gimnasio, no global: la misma persona (o el mismo
// email) puede existir en dos gimnasios distintos como cuentas separadas.
@Index('uq_user_gimnasio_email', ['gimnasioId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'gimnasio_id', type: 'int' })
  gimnasioId!: number;

  @ManyToOne(() => Gimnasio)
  @JoinColumn({ name: 'gimnasio_id' })
  gimnasio!: Gimnasio;

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
    default: UserRole.CLIENTE 
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 20, default: UserStatus.CREADO })
  estado!: UserStatus;

  @OneToMany(() => UserMembresia, (userMembresia: UserMembresia) => userMembresia.user)
  userMembresias!: UserMembresia[];

  // Relacion de conveniencia para consultas con join explicito
  membresias?: Membresia[];

  @OneToMany(() => Pago, (pago: Pago) => pago.user)
  pagos!: Pago[];

  @Column({ name: 'plan_entrenamiento_id', type: 'int', nullable: true })
  planEntrenamientoId!: number | null;

  @ManyToOne(() => PlanEntrenamiento, { nullable: true })
  @JoinColumn({ name: 'plan_entrenamiento_id' })
  planEntrenamiento!: PlanEntrenamiento | null;
}