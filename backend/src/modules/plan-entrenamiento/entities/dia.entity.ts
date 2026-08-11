import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index, JoinColumn } from 'typeorm';
import { PlanEntrenamiento } from './plan-entrenamiento.entity';

@Entity({ name: 'plan_dia', schema: 'public' })
@Index('uq_plan_dia_numero', ['planEntrenamiento', 'numeroDia'], { unique: true })
export class Dia {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id!: number;

    @Column({ name: 'planEntrenamientoId', type: 'bigint' })
    planEntrenamientoId!: number;

    @ManyToOne(() => PlanEntrenamiento)
    @JoinColumn({ name: 'planEntrenamientoId' })
    planEntrenamiento!: PlanEntrenamiento;

    @Column({ name: 'numero_dia', type: 'smallint' })
    numeroDia!: number;

    @Column({ nullable: true, length: 80 })
    nombre?: string;

}
