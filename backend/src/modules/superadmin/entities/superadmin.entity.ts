import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

// Cuenta del dueno de la plataforma. No pertenece a ningun gimnasio: existe
// para administrar el plan (Basico/Pro/Full) de todos los gimnasios.
@Entity({ name: 'superadmin', schema: 'public' })
export class SuperAdmin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
