import {
  ConflictoError,
  NoEncontradoError,
  ReglaDeNegocioError,
} from '../../../shared/domain/domain-error';

export class NombreEjercicioVacioError extends ReglaDeNegocioError {
  constructor() {
    super('El nombre del ejercicio es obligatorio.');
  }
}

export class NombreGrupoMuscularVacioError extends ReglaDeNegocioError {
  constructor() {
    super('El nombre del grupo muscular es obligatorio.');
  }
}

export class EjercicioNoEncontradoError extends NoEncontradoError {
  constructor(id: number) {
    super(`No se encontro el ejercicio con id ${id}`);
  }
}

export class GrupoMuscularNoEncontradoError extends NoEncontradoError {
  constructor(id: number) {
    super(`No se encontro el grupo muscular con id ${id}`);
  }
}

export class EjercicioYaExisteAlCrearError extends ConflictoError {
  constructor() {
    super('El ejercicio ya existe y no se puede volver a crear.');
  }
}

export class EjercicioYaExisteAlActualizarError extends ConflictoError {
  constructor() {
    super('El ejercicio ya existe y no se puede guardar con ese nombre.');
  }
}

export class GrupoMuscularYaExisteAlCrearError extends ConflictoError {
  constructor() {
    super('El grupo muscular ya existe y no se puede volver a crear.');
  }
}

export class GrupoMuscularYaExisteAlActualizarError extends ConflictoError {
  constructor() {
    super('El grupo muscular ya existe y no se puede guardar con ese nombre.');
  }
}

export class GrupoMuscularIdInvalidoError extends ReglaDeNegocioError {
  constructor() {
    super('El id del grupo muscular debe ser un entero mayor a 0.');
  }
}

export class SinCamposParaActualizarEjercicioError extends ReglaDeNegocioError {
  constructor() {
    super('Debes enviar al menos un campo para actualizar el ejercicio.');
  }
}

export class SinCamposParaActualizarGrupoMuscularError extends ReglaDeNegocioError {
  constructor() {
    super('Debes enviar al menos un campo para actualizar el grupo muscular.');
  }
}

export class ArchivoImagenObligatorioError extends ReglaDeNegocioError {
  constructor() {
    super('Debes adjuntar un archivo de imagen.');
  }
}
