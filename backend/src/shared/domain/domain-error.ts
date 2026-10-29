// Errores del dominio. No conocen HTTP: cada subclase expresa POR QUE fallo
// una operacion, y DomainErrorFilter (shared/infrastructure) lo traduce al
// codigo HTTP correspondiente. Un contexto puede extender estas clases para
// fijar sus propios mensajes (ver contexts/auth/domain).
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// Lo pedido no existe (usuario, plan, ejercicio...).
export class NoEncontradoError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

// La operacion choca con el estado actual (ej. email o nombre repetido).
export class ConflictoError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

// Se rompe una regla de negocio con los datos enviados.
export class ReglaDeNegocioError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

// No se pudo verificar la identidad de quien hace la operacion.
export class NoAutorizadoError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

// Se sabe quien es, pero no tiene permitido hacer la operacion.
export class ProhibidoError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
