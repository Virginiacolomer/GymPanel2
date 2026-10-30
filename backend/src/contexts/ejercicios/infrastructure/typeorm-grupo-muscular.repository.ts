import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrupoMuscular } from '../domain/grupo-muscular';
import {
  GrupoMuscularConEjerciciosDto,
  GrupoMuscularRepository,
  GrupoMuscularResumenDto,
} from '../domain/grupo-muscular.repository';
import { NombreGrupoMuscular } from '../domain/nombre-grupo-muscular.vo';
import { GrupoMuscularOrmEntity } from './grupo-muscular.orm-entity';

@Injectable()
export class TypeOrmGrupoMuscularRepository implements GrupoMuscularRepository {
  constructor(
    @InjectRepository(GrupoMuscularOrmEntity)
    private readonly repo: Repository<GrupoMuscularOrmEntity>,
  ) {}

  async guardar(grupo: GrupoMuscular): Promise<GrupoMuscular> {
    const ormEntity = this.repo.create({
      id: grupo.id > 0 ? grupo.id : undefined,
      nombre: grupo.nombre.valor,
    });

    const saved = await this.repo.save(ormEntity);

    return GrupoMuscular.crear({
      id: saved.id,
      nombre: NombreGrupoMuscular.reconstruir(saved.nombre),
    });
  }

  async buscarPorId(id: number): Promise<GrupoMuscular | null> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      return null;
    }

    return GrupoMuscular.crear({
      id: found.id,
      nombre: NombreGrupoMuscular.reconstruir(found.nombre),
    });
  }

  async buscarPorIdConEjercicios(
    id: number,
  ): Promise<GrupoMuscularConEjerciciosDto | null> {
    const found = await this.repo.findOne({
      where: { id },
      relations: { ejercicios: true },
      order: {
        ejercicios: {
          nombre: 'ASC',
        },
      },
    });

    if (!found) {
      return null;
    }

    return {
      id: found.id,
      nombre: found.nombre,
      ejercicios: (found.ejercicios ?? []).map((e) => ({
        id: e.id,
        nombre: e.nombre,
        imagenUrl: e.imagenUrl,
      })),
    };
  }

  async buscarTodosConEjercicios(): Promise<GrupoMuscularConEjerciciosDto[]> {
    const groups = await this.repo.find({
      relations: ['ejercicios'],
      order: {
        nombre: 'ASC',
      },
    });

    return groups.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      ejercicios: (g.ejercicios ?? []).map((e) => ({
        id: e.id,
        nombre: e.nombre,
        imagenUrl: e.imagenUrl,
      })),
    }));
  }

  async buscarTodosResumen(): Promise<GrupoMuscularResumenDto[]> {
    return this.repo.find({
      select: {
        id: true,
        nombre: true,
      },
      order: {
        nombre: 'ASC',
      },
    });
  }

  async buscarTodos(): Promise<GrupoMuscular[]> {
    const groups = await this.repo.find({
      select: {
        id: true,
        nombre: true,
      },
    });

    return groups.map((g) =>
      GrupoMuscular.crear({
        id: g.id,
        nombre: NombreGrupoMuscular.reconstruir(g.nombre),
      }),
    );
  }
}
