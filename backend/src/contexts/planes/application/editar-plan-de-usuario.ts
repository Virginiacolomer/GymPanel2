import { Inject, Injectable } from '@nestjs/common';
import { DatosPlan, PlanEntrenamiento } from '../domain/plan-entrenamiento';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';
import {
  PlanEditadoNoCreadoError,
  UsuarioNoEncontradoError,
} from '../domain/errores-planes';
import {
  ASIGNACIONES_DE_PLAN,
  AsignacionesDePlan,
} from './puertos/asignaciones-de-plan';
import { DescartarPlanSinUso } from './descartar-plan-sin-uso';

export interface PlanDeUsuarioEditadoResultado {
  id: number;
  tipo: 'editado';
  message: string;
}

// Editar el plan de un usuario no toca el plan original: crea una copia
// "editado" con los datos nuevos y se la asigna.
@Injectable()
export class EditarPlanDeUsuario {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
    @Inject(ASIGNACIONES_DE_PLAN)
    private readonly asignaciones: AsignacionesDePlan,
    private readonly descartarPlanSinUso: DescartarPlanSinUso,
  ) {}

  async ejecutar(
    userId: number,
    datos: DatosPlan,
  ): Promise<PlanDeUsuarioEditadoResultado> {
    const asignacion = await this.asignaciones.buscar(userId);
    if (!asignacion) {
      throw new UsuarioNoEncontradoError(userId);
    }

    const copia = PlanEntrenamiento.crearEditado(datos);
    const copiaId = await this.planes.agregar(copia);
    if (copiaId === null) {
      throw new PlanEditadoNoCreadoError();
    }

    await this.asignaciones.asignar(userId, copiaId);

    if (asignacion.planId !== copiaId) {
      await this.descartarPlanSinUso.ejecutar(asignacion.planId);
    }

    return {
      id: copiaId,
      tipo: 'editado',
      message: 'Plan personalizado del usuario actualizado correctamente',
    };
  }
}
