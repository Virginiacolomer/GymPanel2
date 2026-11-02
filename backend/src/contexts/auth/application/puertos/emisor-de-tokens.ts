import { UserRole } from '../../../usuarios/contrato';

export const EMISOR_DE_TOKENS = Symbol('EMISOR_DE_TOKENS');

export interface DatosDelToken {
  sub: number;
  email: string;
  role: UserRole;
}

export interface EmisorDeTokens {
  emitir(datos: DatosDelToken): Promise<string>;
}
