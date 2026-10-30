import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from '../domain/ejercicio';
import {
  EjercicioRepository,
  EjercicioResumenDto,
} from '../domain/ejercicio.repository';
import { NombreEjercicio } from '../domain/nombre-ejercicio.vo';
import { EjercicioOrmEntity } from './ejercicio.orm-entity';
import { GrupoMuscularOrmEntity } from './grupo-muscular.orm-entity';

@Injectable()
export class TypeOrmEjercicioRepository implements EjercicioRepository {
  constructor(
    @InjectRepository(EjercicioOrmEntity)
    private readonly repo: Repository<EjercicioOrmEntity>,
    @InjectRepository(GrupoMuscularOrmEntity)
    private readonly grupoRepo: Repository<GrupoMuscularOrmEntity>,
  ) {}

  async guardar(ejercicio: Ejercicio): Promise<Ejercicio> {
    const grupo = await this.grupoRepo.findOne({
      where: { id: ejercicio.grupoMuscularId },
    });

    const ormEntity = this.repo.create({
      id: ejercicio.id > 0 ? ejercicio.id : undefined,
      nombre: ejercicio.nombre.valor,
      imagenUrl: ejercicio.imagenUrl,
      grupoMuscular: grupo ?? undefined,
      grupoMuscularId: ejercicio.grupoMuscularId,
    });

    const saved = await this.repo.save(ormEntity);

    return Ejercicio.crear({
      id: saved.id,
      nombre: NombreEjercicio.reconstruir(saved.nombre),
      grupoMuscularId: saved.grupoMuscularId ?? saved.grupoMuscular.id,
      imagenUrl: saved.imagenUrl,
    });
  }

  async buscarPorId(id: number): Promise<Ejercicio | null> {
    const found = await this.repo.findOne({
      where: { id },
      relations: { grupoMuscular: true },
    });

    if (!found) {
      return null;
    }

    return Ejercicio.crear({
      id: found.id,
      nombre: NombreEjercicio.reconstruir(found.nombre),
      grupoMuscularId: found.grupoMuscularId ?? found.grupoMuscular.id,
      imagenUrl: found.imagenUrl,
    });
  }

  async buscarTodos(): Promise<Ejercicio[]> {
    const entities = await this.repo.find({
      relations: { grupoMuscular: true },
      order: { id: 'ASC' },
    });

    return entities.map((entity) =>
      Ejercicio.crear({
        id: entity.id,
        nombre: NombreEjercicio.reconstruir(entity.nombre),
        grupoMuscularId: entity.grupoMuscularId ?? entity.grupoMuscular.id,
        imagenUrl: entity.imagenUrl,
      }),
    );
  }

  async buscarPorGrupoMuscularId(
    grupoMuscularId: number,
  ): Promise<EjercicioResumenDto[]> {
    return this.repo
      .createQueryBuilder('ejercicio')
      .innerJoin('ejercicio.grupoMuscular', 'grupo')
      .select([
        'ejercicio.id AS id',
        'ejercicio.nombre AS nombre',
        'ejercicio.imagen_url AS "imagenUrl"',
      ])
      .where('grupo.id = :grupoId', { grupoId: grupoMuscularId })
      .orderBy('ejercicio.nombre', 'ASC')
      .getRawMany<{ id: number; nombre: string; imagenUrl: string | null }>();
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
