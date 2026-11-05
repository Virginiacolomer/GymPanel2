import { Inject, Injectable } from '@nestjs/common';
import { CambiosPlan, PlanEntrenamiento } from '../domain/plan-entrenamiento';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';
import { PlanNoEncontradoError } from '../domain/errores-planes';

@Injectable()
export class EditarPlan {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
  ) {}

  async ejecutar(id: number, cambios: CambiosPlan): Promise<PlanEntrenamiento> {
    const plan = await this.planes.buscarPorId(id);
    if (!plan) {
      throw new PlanNoEncontradoError(id);
    }

    plan.editar(cambios);
    return this.planes.guardar(plan);
  }
}
