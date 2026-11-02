import {
  ConflictoError,
  NoEncontradoError,
  ReglaDeNegocioError,
} from '../../../shared/domain/domain-error';

export class EmailYaRegistradoError extends ConflictoError {
  constructor() {
    super('El correo electronico ya esta registrado.');
  }
}

export class UsuarioNoEncontradoError extends NoEncontradoError {
  constructor(id: number) {
    super(`No se encontro el usuario con id ${id}`);
  }
}

export class EstadoInvalidoError extends ReglaDeNegocioError {
  constructor() {
    super('Estado invalido.');
  }
}
