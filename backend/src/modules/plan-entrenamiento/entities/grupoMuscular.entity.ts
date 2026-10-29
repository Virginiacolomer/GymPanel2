import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Ejercicio } from './ejercicio.entity';

@Entity({ name: 'grupoMuscular', schema: 'public' })
export class GrupoMuscular {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    nombre!: string;

    @OneToMany(() => Ejercicio, (ejercicio: Ejercicio) => ejercicio.grupoMuscular)
    ejercicios!: Ejercicio[];
}
