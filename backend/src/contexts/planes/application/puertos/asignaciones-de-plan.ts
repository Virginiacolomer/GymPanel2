// Que plan tiene asignado cada usuario. Hoy el dato vive en la columna
// user.plan_entrenamiento_id del contexto Usuarios; Planes lo lee y lo escribe
// solo por este puerto, asi los casos de uso no conocen la entidad User.
export const ASIGNACIONES_DE_PLAN = Symbol('ASIGNACIONES_DE_PLAN');

export interface AsignacionDeUsuario {
  userId: number;
  planId: number | null;
}

export interface AsignacionesDePlan {
  // null si el usuario no existe.
  buscar(userId: number): Promise<AsignacionDeUsuario | null>;
  asignar(userId: number, planId: number): Promise<void>;
  contarUsuariosConPlan(planId: number): Promise<number>;
}
