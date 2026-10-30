import { Entity } from '../../../shared/domain/entity';
import { NombreEjercicio } from './nombre-ejercicio.vo';

export interface EjercicioProps {
  id: number;
  nombre: NombreEjercicio;
  grupoMuscularId: number;
  imagenUrl: string | null;
}

export class Ejercicio extends Entity<number> {
  private _nombre: NombreEjercicio;
  private _grupoMuscularId: number;
  private _imagenUrl: string | null;

  private constructor(props: EjercicioProps) {
    super(props.id);
    this._nombre = props.nombre;
    this._grupoMuscularId = props.grupoMuscularId;
    this._imagenUrl = props.imagenUrl;
  }

  static crear(props: {
    id: number;
    nombre: NombreEjercicio;
    grupoMuscularId: number;
    imagenUrl?: string | null;
  }): Ejercicio {
    return new Ejercicio({
      id: props.id,
      nombre: props.nombre,
      grupoMuscularId: props.grupoMuscularId,
      imagenUrl: props.imagenUrl ?? null,
    });
  }

  get nombre(): NombreEjercicio {
    return this._nombre;
  }

  get grupoMuscularId(): number {
    return this._grupoMuscularId;
  }

  get imagenUrl(): string | null {
    return this._imagenUrl;
  }

  renombrar(nuevoNombre: NombreEjercicio): void {
    this._nombre = nuevoNombre;
  }

  cambiarGrupoMuscular(nuevoGrupoId: number): void {
    this._grupoMuscularId = nuevoGrupoId;
  }

  actualizarImagen(imagenUrl: string): void {
    this._imagenUrl = imagenUrl;
  }
}
