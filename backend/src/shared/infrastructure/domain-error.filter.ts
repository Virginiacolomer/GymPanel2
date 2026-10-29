import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ConflictoError,
  DomainError,
  NoAutorizadoError,
  NoEncontradoError,
  ProhibidoError,
  ReglaDeNegocioError,
} from '../domain/domain-error';

// Cada tipo de error de dominio con su codigo HTTP y el texto que Nest pone en
// "error", para que la respuesta sea identica a la de las excepciones HTTP de
// Nest que se usaban antes: { message, error, statusCode }.
const STATUS_POR_ERROR: Array<
  [new (...args: never[]) => DomainError, HttpStatus, string]
> = [
  [NoEncontradoError, HttpStatus.NOT_FOUND, 'Not Found'],
  [ConflictoError, HttpStatus.CONFLICT, 'Conflict'],
  [ReglaDeNegocioError, HttpStatus.BAD_REQUEST, 'Bad Request'],
  [NoAutorizadoError, HttpStatus.UNAUTHORIZED, 'Unauthorized'],
  [ProhibidoError, HttpStatus.FORBIDDEN, 'Forbidden'],
];

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const match = STATUS_POR_ERROR.find(([tipo]) => exception instanceof tipo);

    if (!match) {
      // Un DomainError sin categoria es un error de programacion: se responde
      // igual que Nest ante un error no controlado, sin exponer el mensaje.
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
      return;
    }

    const [, statusCode, error] = match;
    response
      .status(statusCode)
      .json({ message: exception.message, error, statusCode });
  }
}
