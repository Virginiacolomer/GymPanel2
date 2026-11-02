import { ValueObject } from '../../../../shared/domain/value-object';
import { ReglaDeNegocioError } from '../../../../shared/domain/domain-error';

export interface EmailProps {
  valor: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  static crear(email: string): Email {
    if (!email || typeof email !== 'string') {
      throw new ReglaDeNegocioError('El email es obligatorio.');
    }
    const normalizado = email.trim().toLowerCase();
    if (!normalizado.includes('@')) {
      throw new ReglaDeNegocioError('Formato de email invalido.');
    }
    return new Email({ valor: normalizado });
  }

  get valor(): string {
    return this.props.valor;
  }
}
