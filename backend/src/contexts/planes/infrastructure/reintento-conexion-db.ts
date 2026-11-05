import { Logger } from '@nestjs/common';

const logger = new Logger('ReintentoConexionDb');

function esErrorTransitorioDeConexion(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  return (
    message.includes('Connection terminated unexpectedly') ||
    message.includes('ECONNRESET') ||
    message.includes('ETIMEDOUT') ||
    message.includes('57P01')
  );
}

// Si la operacion falla por un corte de conexion con la base, la repite una
// vez. Cualquier otro error (incluidos los de dominio) se propaga sin reintento.
export async function conReintentoDeConexion<T>(
  operationName: string,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!esErrorTransitorioDeConexion(error)) {
      throw error;
    }

    logger.warn(
      `[${operationName}] Error transitorio de conexion con DB. Reintentando una vez. Detalle: ${error instanceof Error ? error.message : String(error)}`,
    );

    return operation();
  }
}
