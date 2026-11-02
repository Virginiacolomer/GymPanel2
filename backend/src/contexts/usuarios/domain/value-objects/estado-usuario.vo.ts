import { ValueObject } from '../../../../shared/domain/value-object';
import { ReglaDeNegocioError } from '../../../../shared/domain/domain-error';

export enum UserStatus {
  CREADO = 'creado',
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export interface EstadoUsuarioProps {
  valor: UserStatus;
}

export class EstadoUsuario extends ValueObject<EstadoUsuarioProps> {
  private constructor(props: EstadoUsuarioProps) {
    super(props);
  }

  static crear(estado: string | UserStatus): EstadoUsuario {
    const normalizado = String(estado ?? '')
      .trim()
      .toLowerCase() as UserStatus;
    if (!Object.values(UserStatus).includes(normalizado)) {
      throw new ReglaDeNegocioError(`Estado invalido: ${estado}`);
    }
    return new EstadoUsuario({ valor: normalizado });
  }

  static creado(): EstadoUsuario {
    return new EstadoUsuario({ valor: UserStatus.CREADO });
  }

  static activo(): EstadoUsuario {
    return new EstadoUsuario({ valor: UserStatus.ACTIVO });
  }

  static inactivo(): EstadoUsuario {
    return new EstadoUsuario({ valor: UserStatus.INACTIVO });
  }

  get valor(): UserStatus {
    return this.props.valor;
  }

  esActivo(): boolean {
    return this.props.valor === UserStatus.ACTIVO;
  }

  esCreado(): boolean {
    return this.props.valor === UserStatus.CREADO;
  }

  esInactivo(): boolean {
    return this.props.valor === UserStatus.INACTIVO;
  }
}
