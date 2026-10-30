import { Entity } from '../../../shared/domain/entity';
import { NombreGrupoMuscular } from './nombre-grupo-muscular.vo';

export interface GrupoMuscularProps {
  id: number;
  nombre: NombreGrupoMuscular;
}

export class GrupoMuscular extends Entity<number> {
  private _nombre: NombreGrupoMuscular;

  private constructor(props: GrupoMuscularProps) {
    super(props.id);
    this._nombre = props.nombre;
  }

  static crear(props: {
    id: number;
    nombre: NombreGrupoMuscular;
  }): GrupoMuscular {
    return new GrupoMuscular(props);
  }

  get nombre(): NombreGrupoMuscular {
    return this._nombre;
  }

  renombrar(nuevoNombre: NombreGrupoMuscular): void {
    this._nombre = nuevoNombre;
  }
}
