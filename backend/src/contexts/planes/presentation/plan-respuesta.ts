import { Logger } from '@nestjs/common';
import { PlanEntrenamiento } from '../domain/plan-entrenamiento';

const logger = new Logger('PlanRespuesta');

// Forma JSON de un plan, fijada por los e2e: id como string (la columna es
// bigint), descripcionesDias repetido en snake_case y solo los dias con datos
// en ejerciciosVisibles/repeticionesVisibles.
export function aRespuestaDePlan(plan: PlanEntrenamiento) {
  const { ejercicios, repeticiones, cantidadDias } = plan.semana;

  const ejerciciosVisibles = ejercicios.filter(
    (dia): dia is number[] => Array.isArray(dia) && dia.length > 0,
  );

  const repeticionesVisibles = repeticiones.filter(
    (dia): dia is string[] => Array.isArray(dia) && dia.length > 0,
  );

  const descripcionesDiasNormalizadas = Array.isArray(plan.descripcionesDias)
    ? plan.descripcionesDias
    : null;

  logger.debug(
    `[aRespuestaDePlan] planId=${plan.id} rawDescripcionesDias=${JSON.stringify(plan.descripcionesDias)} normalized=${JSON.stringify(descripcionesDiasNormalizadas)}`,
  );

  return {
    id: String(plan.id),
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    tipo: plan.tipo,
    cantidadDias,
    ejercicios,
    repeticiones,
    descripcionesDias: descripcionesDiasNormalizadas,
    descripciones_dias: descripcionesDiasNormalizadas,
    ejerciciosVisibles,
    repeticionesVisibles,
  };
}
