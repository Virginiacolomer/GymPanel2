import { Inject, Injectable } from '@nestjs/common';
import { DatosPlan, PlanEntrenamiento } from '../domain/plan-entrenamiento';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';

export interface PlanCreadoResultado {
  id: number | null;
  message: string;
}

// Alta de un plan predeterminado (plantilla del admin).
@Injectable()
export class CrearPlan {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
  ) {}

  async ejecutar(datos: DatosPlan): Promise<PlanCreadoResultado> {
    const plan = PlanEntrenamiento.crearPredeterminado(datos);
    const id = await this.planes.agregar(plan);

    return {
      id,
      message: 'Plan de entrenamiento creado correctamente',
    };
  }
}
