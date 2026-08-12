import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// Una fila de horario de clases (ej: "Lunes a viernes - Manana" / "6:30 - 10:00").
// Cada gimnasio administra las suyas de forma independiente.
@Entity({ name: 'horario', schema: 'public' })
export class Horario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'gimnasio_id', type: 'int' })
  gimnasioId!: number;

  @Column({ type: 'varchar', length: 120 })
  descripcion!: string;

  @Column({ type: 'varchar', length: 60 })
  horario!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
