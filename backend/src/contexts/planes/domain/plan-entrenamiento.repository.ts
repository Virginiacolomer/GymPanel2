import { PlanEntrenamiento } from './plan-entrenamiento';

export const PLAN_ENTRENAMIENTO_REPOSITORY = Symbol(
  'PLAN_ENTRENAMIENTO_REPOSITORY',
);

export interface PlanEntrenamientoRepository {
  // Inserta un plan nuevo y devuelve su id, o null si la base no lo informo.
  agregar(plan: PlanEntrenamiento): Promise<number | null>;
  guardar(plan: PlanEntrenamiento): Promise<PlanEntrenamiento>;
  buscarPorId(id: number): Promise<PlanEntrenamiento | null>;
  listarPredeterminados(): Promise<PlanEntrenamiento[]>;
  existe(id: number): Promise<boolean>;
  eliminar(id: number): Promise<void>;
}
