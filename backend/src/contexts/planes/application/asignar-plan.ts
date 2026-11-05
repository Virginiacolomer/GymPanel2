import { Inject, Injectable } from '@nestjs/common';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';
import {
  PlanNoEncontradoError,
  UsuarioNoEncontradoError,
} from '../domain/errores-planes';
import {
  ASIGNACIONES_DE_PLAN,
  AsignacionesDePlan,
} from './puertos/asignaciones-de-plan';
import { DescartarPlanSinUso } from './descartar-plan-sin-uso';

@Injectable()
export class AsignarPlan {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
    @Inject(ASIGNACIONES_DE_PLAN)
    private readonly asignaciones: AsignacionesDePlan,
    private readonly descartarPlanSinUso: DescartarPlanSinUso,
  ) {}

  async ejecutar(userId: number, planId: number): Promise<{ message: string }> {
    const asignacion = await this.asignaciones.buscar(userId);
    if (!asignacion) {
      throw new UsuarioNoEncontradoError(userId);
    }

    if (!(await this.planes.existe(planId))) {
      throw new PlanNoEncontradoError(planId);
    }

    await this.asignaciones.asignar(userId, planId);

    if (asignacion.planId !== planId) {
      await this.descartarPlanSinUso.ejecutar(asignacion.planId);
    }

    return { message: 'Plan asignado correctamente' };
  }
}
