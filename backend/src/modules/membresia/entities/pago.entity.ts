import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Membresia } from './membresia.entity';
import { UserMembresia } from './userMembresia.entity';

@Entity({ name: 'pago', schema: 'public' })
export class Pago {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    userId!: number | null;

    @Column({ name: 'user_membresia_id', type: 'int', nullable: true })
    userMembresiaId!: number | null;

    @Column({ name: 'membresiaId', type: 'int', nullable: true })
    membresiaId!: number | null;

    // 'efectivo' (admin marca pagado a mano) o 'mercado_pago' (via checkout).
    @Column({ name: 'metodo_pago', type: 'varchar', length: 30, nullable: true })
    metodoPago!: string | null;

    // Id de pago de Mercado Pago; unico para evitar procesar el mismo pago
    // dos veces si el webhook llega repetido.
    @Column({ name: 'mp_payment_id', type: 'varchar', length: 50, nullable: true, unique: true })
    mpPaymentId!: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt!: Date;

    @ManyToOne(() => User, (user: User) => user.pagos, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User | null;

    @ManyToOne(() => UserMembresia, (userMembresia: UserMembresia) => userMembresia.pagos, { nullable: true })
    @JoinColumn({ name: 'user_membresia_id' })
    userMembresia!: UserMembresia | null;

    @ManyToOne(() => Membresia, { nullable: true })
    @JoinColumn({ name: 'membresiaId' })
    membresia!: Membresia | null;
}
