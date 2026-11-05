import { Inject, Injectable } from '@nestjs/common';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';
import { PlanNoEncontradoError } from '../domain/errores-planes';
import {
  ASIGNACIONES_DE_PLAN,
  AsignacionesDePlan,
} from './puertos/asignaciones-de-plan';

@Injectable()
export class EliminarPlan {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
    @Inject(ASIGNACIONES_DE_PLAN)
    private readonly asignaciones: AsignacionesDePlan,
  ) {}

  async ejecutar(id: number): Promise<{ message: string }> {
    const plan = await this.planes.buscarPorId(id);
    if (!plan) {
      throw new PlanNoEncontradoError(id);
    }

    const usuarios = await this.asignaciones.contarUsuariosConPlan(id);
    plan.verificarQueSePuedeEliminar(usuarios);

    await this.planes.eliminar(id);
    return { message: 'Plan de entrenamiento eliminado correctamente' };
  }
}
