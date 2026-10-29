import {
  NoAutorizadoError,
  NoEncontradoError,
  ProhibidoError,
} from '../../../shared/domain/domain-error';

// Motivos por los que se rechaza un inicio de sesion. Cada uno fija su mensaje
// para que sea el mismo en toda la app.

export class EmailNoRegistradoError extends NoEncontradoError {
  constructor() {
    super('El correo electronico no esta registrado.');
  }
}

export class ContrasenaIncorrectaError extends NoAutorizadoError {
  constructor() {
    super('La contrasena es incorrecta.');
  }
}

export class CuentaNoActivaError extends ProhibidoError {
  constructor() {
    super('Espera que tu entrenador habilite tu cuenta!');
  }
}
