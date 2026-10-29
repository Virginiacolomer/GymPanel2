import { ArgumentsHost } from '@nestjs/common';
import {
  ConflictoError,
  DomainError,
  NoAutorizadoError,
  NoEncontradoError,
  ProhibidoError,
  ReglaDeNegocioError,
} from '../domain/domain-error';
import { DomainErrorFilter } from './domain-error.filter';

class ErrorSinCategoria extends DomainError {
  constructor() {
    super('detalle interno');
  }
}

function capturar(error: DomainError) {
  const json = jest.fn<void, [unknown]>();
  const status = jest.fn<{ json: typeof json }, [number]>(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  new DomainErrorFilter().catch(error, host);

  return {
    status: status.mock.calls[0][0],
    body: json.mock.calls[0][0],
  };
}

describe('DomainErrorFilter', () => {
  it.each([
    [new NoEncontradoError('no esta'), 404, 'Not Found'],
    [new ConflictoError('repetido'), 409, 'Conflict'],
    [new ReglaDeNegocioError('regla rota'), 400, 'Bad Request'],
    [new NoAutorizadoError('quien sos'), 401, 'Unauthorized'],
    [new ProhibidoError('no podes'), 403, 'Forbidden'],
  ])(
    'traduce %p con el mismo formato que las excepciones de Nest',
    (error, statusCode, nombre) => {
      expect(capturar(error)).toEqual({
        status: statusCode,
        body: { message: error.message, error: nombre, statusCode },
      });
    },
  );

  it('responde 500 sin exponer el mensaje si el error no tiene categoria', () => {
    expect(capturar(new ErrorSinCategoria())).toEqual({
      status: 500,
      body: { statusCode: 500, message: 'Internal server error' },
    });
  });

  it('las subclases de un contexto heredan la categoria', () => {
    class EmailNoRegistrado extends NoEncontradoError {
      constructor() {
        super('El correo electronico no esta registrado.');
      }
    }
    expect(capturar(new EmailNoRegistrado()).status).toBe(404);
  });
});
