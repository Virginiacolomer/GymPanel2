import {
  NoEncontradoError,
  ReglaDeNegocioError,
} from '../../../shared/domain/domain-error';

export class PlanNoEncontradoError extends NoEncontradoError {
  constructor(id: number) {
    super(`No se encontro el plan de entrenamiento con id ${id}`);
  }
}

// El usuario al que se le asigna o consulta el plan no existe.
export class UsuarioNoEncontradoError extends NoEncontradoError {
  constructor(userId: number) {
    super(`No se encontro el usuario con id ${userId}`);
  }
}

// La semana enviada no respeta la forma del plan (7 posiciones, dias activos,
// ejercicios alineados con repeticiones). El mensaje dice que dia fallo.
export class SemanaInvalidaError extends ReglaDeNegocioError {
  constructor(message: string) {
    super(message);
  }
}

export class PlanPredeterminadoNoSeEliminaError extends ReglaDeNegocioError {
  constructor() {
    super('Los planes predeterminados no se pueden eliminar.');
  }
}

export class PlanEditadoAsignadoNoSeEliminaError extends ReglaDeNegocioError {
  constructor() {
    super('No se puede eliminar un plan editado que esta asignado a usuarios.');
  }
}

export class PlanEditadoNoCreadoError extends ReglaDeNegocioError {
  constructor() {
    super('No se pudo crear el plan editado para el usuario.');
  }
}
