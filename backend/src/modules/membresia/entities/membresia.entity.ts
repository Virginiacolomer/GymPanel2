import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { UserMembresia } from './userMembresia.entity';
import { Gimnasio } from '../../gimnasio/entities/gimnasio.entity';

@Entity({ name: 'membresia', schema: 'public' })
export class Membresia {
    @PrimaryGeneratedColumn()
    id!: number;

    // Cada gimnasio define sus propias membresias (nombre, dias, costo).
    @Column({ name: 'gimnasio_id', type: 'int' })
    gimnasioId!: number;

    @ManyToOne(() => Gimnasio)
    @JoinColumn({ name: 'gimnasio_id' })
    gimnasio!: Gimnasio;

    @Column()
    nombre!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    descripcion!: string | null;

    // Frecuencia semanal como numero entero (ej: 3 = 3 veces por semana).
    @Column({ type: 'int' })
    dias!: number;

    @Column ()
    costo!: number;

  @OneToMany(() => UserMembresia, (userMembresia: UserMembresia) => userMembresia.membresia)
    userMembresias!: UserMembresia[];
}
