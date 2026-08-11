import { Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, Column, OneToMany, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Membresia } from './membresia.entity';
import { EstadoUserMembresia } from './estadoUserMembresia.entity';
import { Pago } from './pago.entity';

// Sin gimnasioId propio: queda scopeada implicitamente porque userId y
// membresiaId ya pertenecen cada uno a un solo gimnasio. El servicio debe
// validar que ambos sean del mismo gimnasio antes de crear la relacion.
@Entity({ name: 'user_membresia', schema: 'public' })
@Index('uq_user_membresia_user_membresia', ['userId', 'membresiaId'], { unique: true })
export class UserMembresia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'membresia_id', type: 'int' })
  membresiaId!: number;

  @Column({ name: 'estado_id', type: 'int', nullable: true })
  estadoId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user: User) => user.userMembresias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Membresia, (membresia: Membresia) => membresia.userMembresias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'membresia_id' })
  membresia!: Membresia;

  @ManyToOne(() => EstadoUserMembresia, (estado: EstadoUserMembresia) => estado.userMembresias)
  @JoinColumn({ name: 'estado_id' })
  estado!: EstadoUserMembresia;

  @OneToMany(() => Pago, (pago: Pago) => pago.userMembresia)
  pagos!: Pago[];
}
