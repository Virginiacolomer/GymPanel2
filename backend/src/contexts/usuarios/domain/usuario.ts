import { Entity } from '../../../shared/domain/entity';
import { Email } from './value-objects/email.vo';
import { EstadoUsuario } from './value-objects/estado-usuario.vo';
import { Rol } from './value-objects/rol.vo';

export interface UsuarioCrearProps {
  nombre: string;
  apellido: string;
  dni: string;
  email: Email;
  passwordHash: string;
  rol?: Rol;
  estado?: EstadoUsuario;
  planEntrenamientoId?: number | null;
}

export interface UsuarioReconstituirProps {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: Email;
  passwordHash: string;
  rol: Rol;
  estado: EstadoUsuario;
  planEntrenamientoId: number | null;
}

export class Usuario extends Entity<number> {
  private _nombre: string;
  private _apellido: string;
  private _dni: string;
  private _email: Email;
  private _passwordHash: string;
  private _rol: Rol;
  private _estado: EstadoUsuario;
  private _planEntrenamientoId: number | null;

  private constructor(props: UsuarioReconstituirProps) {
    super(props.id);
    this._nombre = props.nombre;
    this._apellido = props.apellido;
    this._dni = props.dni;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._rol = props.rol;
    this._estado = props.estado;
    this._planEntrenamientoId = props.planEntrenamientoId;
  }

  static nuevo(props: UsuarioCrearProps): Usuario {
    return new Usuario({
      id: 0,
      nombre: props.nombre,
      apellido: props.apellido,
      dni: props.dni,
      email: props.email,
      passwordHash: props.passwordHash,
      rol: props.rol ?? Rol.cliente(),
      estado: props.estado ?? EstadoUsuario.creado(),
      planEntrenamientoId: props.planEntrenamientoId ?? null,
    });
  }

  static reconstituir(props: UsuarioReconstituirProps): Usuario {
    return new Usuario(props);
  }

  get nombre(): string {
    return this._nombre;
  }

  get apellido(): string {
    return this._apellido;
  }

  get dni(): string {
    return this._dni;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get rol(): Rol {
    return this._rol;
  }

  get estado(): EstadoUsuario {
    return this._estado;
  }

  get planEntrenamientoId(): number | null {
    return this._planEntrenamientoId;
  }

  activar(): void {
    this._estado = EstadoUsuario.activo();
  }

  desactivar(): void {
    this._estado = EstadoUsuario.inactivo();
  }

  cambiarEstado(nuevoEstado: EstadoUsuario): void {
    this._estado = nuevoEstado;
  }

  asignarPlan(planId: number): void {
    this._planEntrenamientoId = planId;
  }

  desasignarPlan(): void {
    this._planEntrenamientoId = null;
  }
}
