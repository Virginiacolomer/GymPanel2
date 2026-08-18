import { PlanGimnasio } from './enums/plan-gimnasio.enum';

// Cada valor corresponde a una pantalla/accion del panel de administrador
// (o, en el caso de PAGO_MERCADOPAGO, una accion del cliente) que se puede
// habilitar o deshabilitar segun el plan que paga el gimnasio.
export enum Funcionalidad {
  GESTION_USUARIOS = 'gestion_usuarios',
  ALTA_USUARIOS = 'alta_usuarios',
  GESTION_MEMBRESIAS = 'gestion_membresias',
  DATOS_Y_HORARIOS = 'datos_y_horarios',
  CATALOGO_EJERCICIOS = 'catalogo_ejercicios',
  CREACION_PLANES = 'creacion_planes',
  ASIGNACION_PLANES = 'asignacion_planes',
  PAGO_MERCADOPAGO = 'pago_mercadopago',
  REPORTE_INGRESOS = 'reporte_ingresos',
}

const BASICO: Funcionalidad[] = [
  Funcionalidad.GESTION_USUARIOS,
  Funcionalidad.ALTA_USUARIOS,
  Funcionalidad.GESTION_MEMBRESIAS,
  Funcionalidad.DATOS_Y_HORARIOS,
];

const PRO: Funcionalidad[] = [
  ...BASICO,
  Funcionalidad.CATALOGO_EJERCICIOS,
  Funcionalidad.CREACION_PLANES,
  Funcionalidad.ASIGNACION_PLANES,
];

const FULL: Funcionalidad[] = [...PRO, Funcionalidad.PAGO_MERCADOPAGO, Funcionalidad.REPORTE_INGRESOS];

export const FUNCIONALIDADES_POR_PLAN: Record<PlanGimnasio, Funcionalidad[]> = {
  [PlanGimnasio.BASICO]: BASICO,
  [PlanGimnasio.PRO]: PRO,
  [PlanGimnasio.FULL]: FULL,
};
