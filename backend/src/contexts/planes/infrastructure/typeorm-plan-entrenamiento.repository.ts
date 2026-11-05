import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntrenamiento } from '../domain/plan-entrenamiento';
import { PlanEntrenamientoRepository } from '../domain/plan-entrenamiento.repository';
import { SemanaDeEntrenamiento } from '../domain/semana-de-entrenamiento';
import { PlanEntrenamientoOrmEntity } from './plan-entrenamiento.orm-entity';

// La columna id es bigint: Postgres la devuelve como string y aca se pasa a
// number para el dominio. La respuesta HTTP la vuelve a mostrar como string.
@Injectable()
export class TypeOrmPlanEntrenamientoRepository implements PlanEntrenamientoRepository {
  constructor(
    @InjectRepository(PlanEntrenamientoOrmEntity)
    private readonly repo: Repository<PlanEntrenamientoOrmEntity>,
  ) {}

  async agregar(plan: PlanEntrenamiento): Promise<number | null> {
    // Sin id: lo genera la base.
    const { id, ...columnas } = this.aFila(plan);
    const resultado = await this.repo.insert(columnas);
    const insertedId = Number(resultado.identifiers[0]?.id);
    return Number.isFinite(insertedId) ? insertedId : null;
  }

  // Se carga la fila y se le copian los datos antes de guardar: con una entidad
  // armada desde cero, save() no reconoce el id bigint y hace un INSERT.
  async guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento> {
    const fila = await this.repo.findOneOrFail({ where: { id: plan.id } });
    const { id, ...columnas } = this.aFila(plan);
    const guardado = await this.repo.save(Object.assign(fila, columnas));
    return this.aDominio(guardado);
  }

  async buscarPorId(id: number): Promise<PlanEntrenamiento | null> {
    const fila = await this.repo.findOne({ where: { id } });
    return fila ? this.aDominio(fila) : null;
  }

  async listarPredeterminados(): Promise<PlanEntrenamiento[]> {
    const filas = await this.repo.find({
      where: { tipo: 'predeterminado' },
      order: { id: 'ASC' },
    });
    return filas.map((fila) => this.aDominio(fila));
  }

  existe(id: number): Promise<boolean> {
    return this.repo.existsBy({ id });
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  private aFila(plan: PlanEntrenamiento): PlanEntrenamientoOrmEntity {
    return {
      id: plan.id,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      tipo: plan.tipo,
      cantidadDias: plan.semana.cantidadDias,
      ejercicios: plan.semana.ejercicios,
      repeticiones: plan.semana.repeticiones,
      descripcionesDias: plan.descripcionesDias,
    };
  }

  private aDominio(fila: PlanEntrenamientoOrmEntity): PlanEntrenamiento {
    return PlanEntrenamiento.reconstruir({
      id: Number(fila.id),
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      tipo: fila.tipo,
      semana: SemanaDeEntrenamiento.reconstruir(
        fila.cantidadDias,
        fila.ejercicios,
        fila.repeticiones,
      ),
      descripcionesDias: fila.descripcionesDias,
    });
  }
}
