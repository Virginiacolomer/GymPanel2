import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsuarioConCredenciales, UsuariosQuery } from './usuarios.query';

// Implementacion de UsuariosQuery sobre TypeORM.
@Injectable()
export class TypeOrmUsuariosQuery implements UsuariosQuery {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async buscarPorEmail(email: string): Promise<UsuarioConCredenciales | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email,
      role: user.role,
      estado: user.estado,
      planEntrenamientoId: user.planEntrenamientoId,
      passwordHash: user.password_hash,
    };
  }
}
