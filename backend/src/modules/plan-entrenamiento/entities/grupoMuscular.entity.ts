import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Ejercicio } from './ejercicio.entity';
import { Gimnasio } from '../../gimnasio/entities/gimnasio.entity';

// Cada gimnasio arma su propio catalogo de grupos musculares y ejercicios
// (los crea su admin desde cero), asi que tambien queda scopeado por gimnasio.
@Entity({ name: 'grupoMuscular', schema: 'public' })
export class GrupoMuscular {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'gimnasio_id', type: 'int' })
    gimnasioId!: number;

    @ManyToOne(() => Gimnasio)
    @JoinColumn({ name: 'gimnasio_id' })
    gimnasio!: Gimnasio;

    @Column()
    nombre!: string;

    @OneToMany(() => Ejercicio, (ejercicio: Ejercicio) => ejercicio.grupoMuscular)
    ejercicios!: Ejercicio[];
}
