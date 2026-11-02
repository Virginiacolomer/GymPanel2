import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Usuario } from '../domain/usuario';
import { UsuarioRepository } from '../domain/usuario.repository';
import { Email } from '../domain/value-objects/email.vo';
import { UserRole } from '../domain/value-objects/rol.vo';
import { UserStatus } from '../domain/value-objects/estado-usuario.vo';
import { EmailYaRegistradoError } from '../domain/errores-usuario';
import { User } from './entities/user.entity';
import { UsuarioOrmMapper } from './mappers/usuario-orm.mapper';

@Injectable()
export class TypeOrmUsuarioRepository implements UsuarioRepository {
  constructor(
    @InjectRepository(User)
    private readonly ormRepo: Repository<User>,
  ) {}

  async guardar(usuario: Usuario): Promise<Usuario> {
    const ormEntity = UsuarioOrmMapper.toOrm(usuario);
    try {
      const saved = await this.ormRepo.save(ormEntity);
      return UsuarioOrmMapper.toDomain(saved);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === '23505'
      ) {
        throw new EmailYaRegistradoError();
      }
      throw error;
    }
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    return orm ? UsuarioOrmMapper.toDomain(orm) : null;
  }

  async buscarPorEmail(email: Email): Promise<Usuario | null> {
    const orm = await this.ormRepo.findOne({ where: { email: email.valor } });
    return orm ? UsuarioOrmMapper.toDomain(orm) : null;
  }

  async buscarPendientes(): Promise<Usuario[]> {
    const orms = await this.ormRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CLIENTE })
      .andWhere(
        "(user.estado IS NULL OR LOWER(TRIM(user.estado)) = :creado OR user.estado = '')",
        { creado: UserStatus.CREADO },
      )
      .orderBy('user.id', 'ASC')
      .getMany();

    return orms.map((orm) => UsuarioOrmMapper.toDomain(orm));
  }

  async buscarClientesActivos(): Promise<Usuario[]> {
    const orms = await this.ormRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CLIENTE })
      .andWhere('LOWER(TRIM(COALESCE(user.estado, :fallback))) = :estado', {
        fallback: UserStatus.CREADO,
        estado: UserStatus.ACTIVO,
      })
      .orderBy('user.id', 'ASC')
      .getMany();

    return orms.map((orm) => UsuarioOrmMapper.toDomain(orm));
  }

  async buscarTodos(): Promise<Usuario[]> {
    const orms = await this.ormRepo.find({
      order: { id: 'ASC' },
    });
    return orms.map((orm) => UsuarioOrmMapper.toDomain(orm));
  }

  async eliminar(id: number): Promise<boolean> {
    const result = await this.ormRepo.delete({ id });
    return !!(result.affected && result.affected > 0);
  }
}
