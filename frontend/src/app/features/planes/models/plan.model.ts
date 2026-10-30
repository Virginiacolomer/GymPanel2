export interface CreatePlanEntrenamientoRequest {
  nombre: string;
  descripcion?: string;
  cantidadDias: number;
  ejercicios: Array<number[] | null>;
  repeticiones: Array<string[] | null>;
  descripcionesDias?: Array<string | null>;
}

export interface PlanEntrenamientoResponse {
  id: number;
  nombre: string;
  descripcion?: string | null;
  descripcionesDias?: Array<string | null>;
  descripciones_dias?: Array<string | null>;
  tipo?: 'predeterminado' | 'editado';
  cantidadDias: number;
  ejercicios: Array<number[] | null>;
  repeticiones: Array<string[] | null>;
  ejerciciosVisibles: number[][];
  repeticionesVisibles: string[][];
}

export interface UserPlanResponse {
  userId?: number;
  planEntrenamientoId?: number | null;
  plan: PlanEntrenamientoResponse | null;
}

export interface UserEditedPlanResponse {
  id: number;
  tipo: 'editado';
  message: string;
}

