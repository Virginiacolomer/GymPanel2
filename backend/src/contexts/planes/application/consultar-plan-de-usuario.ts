import { Inject, Injectable } from '@nestjs/common';
import { PlanEntrenamiento } from '../domain/plan-entrenamiento';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';
import { UsuarioNoEncontradoError } from '../domain/errores-planes';
import {
  ASIGNACIONES_DE_PLAN,
  AsignacionDeUsuario,
  AsignacionesDePlan,
} from './puertos/asignaciones-de-plan';

export interface PlanDeUsuario {
  planId: number | null;
  plan: PlanEntrenamiento | null;
}

// Dos formas de consultar el plan asignado:
// - deUsuario: el admin consulta a otro usuario; 404 si el usuario no existe.
// - delCliente: el cliente consulta el suyo (id del token); si no existe o no
//   tiene plan, responde sin plan en vez de fallar.
@Injectable()
export class ConsultarPlanDeUsuario {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
    @Inject(ASIGNACIONES_DE_PLAN)
    private readonly asignaciones: AsignacionesDePlan,
  ) {}

  async deUsuario(userId: number): Promise<PlanDeUsuario> {
    const asignacion = await this.asignaciones.buscar(userId);
    if (!asignacion) {
      throw new UsuarioNoEncontradoError(userId);
    }
    return this.conPlan(asignacion);
  }

  async delCliente(userId: number): Promise<PlanDeUsuario> {
    const asignacion = await this.asignaciones.buscar(userId);
    if (!asignacion) {
      return { planId: null, plan: null };
    }
    return this.conPlan(asignacion);
  }

  private async conPlan(
    asignacion: AsignacionDeUsuario,
  ): Promise<PlanDeUsuario> {
    if (!asignacion.planId) {
      return { planId: null, plan: null };
    }
    const plan = await this.planes.buscarPorId(asignacion.planId);
    return { planId: asignacion.planId, plan };
  }
}
