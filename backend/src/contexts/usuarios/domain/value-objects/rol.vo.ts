import { ValueObject } from '../../../../shared/domain/value-object';
import { ReglaDeNegocioError } from '../../../../shared/domain/domain-error';

export enum UserRole {
  CLIENTE = 'CLIENTE',
  ADMIN = 'ADMIN',
}

export interface RolProps {
  valor: UserRole;
}

export class Rol extends ValueObject<RolProps> {
  private constructor(props: RolProps) {
    super(props);
  }

  static crear(rol: string | UserRole): Rol {
    if (!rol || !Object.values(UserRole).includes(rol as UserRole)) {
      throw new ReglaDeNegocioError(`Rol invalido: ${rol}`);
    }
    return new Rol({ valor: rol as UserRole });
  }

  static cliente(): Rol {
    return new Rol({ valor: UserRole.CLIENTE });
  }

  static admin(): Rol {
    return new Rol({ valor: UserRole.ADMIN });
  }

  get valor(): UserRole {
    return this.props.valor;
  }

  esAdmin(): boolean {
    return this.props.valor === UserRole.ADMIN;
  }

  esCliente(): boolean {
    return this.props.valor === UserRole.CLIENTE;
  }
}
