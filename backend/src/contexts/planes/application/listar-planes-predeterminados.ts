import { Inject, Injectable } from '@nestjs/common';
import { PlanEntrenamiento } from '../domain/plan-entrenamiento';
import {
  PLAN_ENTRENAMIENTO_REPOSITORY,
  PlanEntrenamientoRepository,
} from '../domain/plan-entrenamiento.repository';

// Los editados son copias de un usuario y no aparecen en el listado.
@Injectable()
export class ListarPlanesPredeterminados {
  constructor(
    @Inject(PLAN_ENTRENAMIENTO_REPOSITORY)
    private readonly planes: PlanEntrenamientoRepository,
  ) {}

  ejecutar(): Promise<PlanEntrenamiento[]> {
    return this.planes.listarPredeterminados();
  }
}
