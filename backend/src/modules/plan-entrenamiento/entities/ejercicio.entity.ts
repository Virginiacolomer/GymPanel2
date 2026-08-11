import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GrupoMuscular } from './grupoMuscular.entity';
import { Gimnasio } from '../../gimnasio/entities/gimnasio.entity';

@Entity({ name: 'ejercicio', schema: 'public' })
export class Ejercicio {
    @PrimaryGeneratedColumn()
    id!: number;

    // Denormalizado desde grupoMuscular.gimnasioId para poder filtrar por
    // gimnasio sin necesitar un join en cada consulta.
    @Column({ name: 'gimnasio_id', type: 'int' })
    gimnasioId!: number;

    @ManyToOne(() => Gimnasio)
    @JoinColumn({ name: 'gimnasio_id' })
    gimnasio!: Gimnasio;

    @Column()
    nombre!: string;

    @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
    imagenUrl!: string | null;

    @ManyToOne(() => GrupoMuscular, (grupoMuscular: GrupoMuscular) => grupoMuscular.ejercicios)
    grupoMuscular!: GrupoMuscular;
}