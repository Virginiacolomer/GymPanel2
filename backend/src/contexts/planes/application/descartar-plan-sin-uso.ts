import { Inject, Injectable } from '@nestjs/common';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';
import {
  ASIGNACIONES_DE_PLAN,
  AsignacionesDePlan,
} from './puertos/asignaciones-de-plan';

// Paso comun de AsignarPlan y EditarPlanDeUsuario: despues de cambiarle el plan
// a un usuario, el anterior se borra si el dominio dice que se descarta.
@Injectable()
export class DescartarPlanSinUso {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
    @Inject(ASIGNACIONES_DE_PLAN)
    private readonly asignaciones: AsignacionesDePlan,
  ) {}

  async ejecutar(planId: number | null): Promise<void> {
    if (!planId) {
      return;
    }

    const plan = await this.planes.buscarPorId(planId);
    if (!plan) {
      return;
    }

    const usuarios = await this.asignaciones.contarUsuariosConPlan(planId);
    if (plan.debeDescartarse(usuarios)) {
      await this.planes.eliminar(planId);
    }
  }
}
