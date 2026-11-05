import { ValueObject } from '../../../shared/domain/value-object';

export interface NombreTextoProps {
  valor: string;
}

export abstract class NombreTexto extends ValueObject<NombreTextoProps> {
  protected static normalizar(raw: string): string {
    return String(raw ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  get valor(): string {
    return this.props.valor;
  }
}
