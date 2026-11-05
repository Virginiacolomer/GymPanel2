import { Entity } from '../../../shared/domain/entity';
import {
  PlanEditadoAsignadoNoSeEliminaError,
  PlanPredeterminadoNoSeEliminaError,
} from './errores-planes';
import {
  EjerciciosPorDia,
  RepeticionesPorDia,
  SemanaDeEntrenamiento,
} from './semana-de-entrenamiento';

// predeterminado: plantilla que arma el admin y se reutiliza.
// editado: copia personalizada para un usuario, creada al editar su plan.
export type TipoPlan = 'predeterminado' | 'editado';

export type DescripcionesDias = Array<string | null> | null;

export interface DatosPlan {
  nombre: string;
  descripcion?: string;
  cantidadDias: number;
  ejercicios: EjerciciosPorDia;
  repeticiones: RepeticionesPorDia;
  descripcionesDias?: DescripcionesDias;
}

// En una edicion cada campo es opcional: lo que no llega se conserva.
export type CambiosPlan = Partial<
  Omit<DatosPlan, 'descripcion' | 'descripcionesDias'>
> & {
  descripcion?: string | null;
  descripcionesDias?: DescripcionesDias;
};

interface PlanProps {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: TipoPlan;
  semana: SemanaDeEntrenamiento;
  descripcionesDias: DescripcionesDias;
}

export class PlanEntrenamiento extends Entity<number> {
  private _nombre: string;
  private _descripcion: string | null;
  private readonly _tipo: TipoPlan;
  private _semana: SemanaDeEntrenamiento;
  private _descripcionesDias: DescripcionesDias;

  private constructor(props: PlanProps) {
    super(props.id);
    this._nombre = props.nombre;
    this._descripcion = props.descripcion;
    this._tipo = props.tipo;
    this._semana = props.semana;
    this._descripcionesDias = props.descripcionesDias;
  }

  // Un plan nuevo todavia no tiene id: lo asigna la base al guardarlo (0).
  static crearPredeterminado(datos: DatosPlan): PlanEntrenamiento {
    return PlanEntrenamiento.nuevo('predeterminado', datos);
  }

  static crearEditado(datos: DatosPlan): PlanEntrenamiento {
    return PlanEntrenamiento.nuevo('editado', datos);
  }

  static reconstruir(props: PlanProps): PlanEntrenamiento {
    return new PlanEntrenamiento(props);
  }

  private static nuevo(tipo: TipoPlan, datos: DatosPlan): PlanEntrenamiento {
    return new PlanEntrenamiento({
      id: 0,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() ?? null,
      tipo,
      semana: SemanaDeEntrenamiento.crear(
        datos.cantidadDias,
        datos.ejercicios,
        datos.repeticiones,
      ),
      descripcionesDias: datos.descripcionesDias ?? null,
    });
  }

  get nombre(): string {
    return this._nombre;
  }

  get descripcion(): string | null {
    return this._descripcion;
  }

  get tipo(): TipoPlan {
    return this._tipo;
  }

  get semana(): SemanaDeEntrenamiento {
    return this._semana;
  }

  get descripcionesDias(): DescripcionesDias {
    return this._descripcionesDias;
  }

  // La semana se vuelve a validar completa con los valores combinados: si se
  // baja cantidadDias sin mandar la semana nueva, los dias sobrantes fallan.
  editar(cambios: CambiosPlan): void {
    const cantidadDias = cambios.cantidadDias ?? this._semana.cantidadDias;
    this._semana = SemanaDeEntrenamiento.crear(
      cantidadDias,
      cambios.ejercicios ?? this._semana.ejercicios,
      cambios.repeticiones ?? this._semana.repeticiones,
    );

    this._nombre = cambios.nombre?.trim() ?? this._nombre;
    if (cambios.descripcion !== undefined) {
      this._descripcion = cambios.descripcion?.trim() || null;
    }
    if (cambios.descripcionesDias !== undefined) {
      this._descripcionesDias = cambios.descripcionesDias;
    }
  }

  // Un predeterminado no se elimina nunca; un editado, solo si nadie lo usa.
  verificarQueSePuedeEliminar(usuariosQueLoUsan: number): void {
    if (this._tipo === 'predeterminado') {
      throw new PlanPredeterminadoNoSeEliminaError();
    }
    if (usuariosQueLoUsan > 0) {
      throw new PlanEditadoAsignadoNoSeEliminaError();
    }
  }

  // Al reasignar, el plan anterior se descarta solo si era una copia editada
  // que quedo sin usuarios. Los predeterminados se conservan siempre.
  debeDescartarse(usuariosQueLoUsan: number): boolean {
    return this._tipo === 'editado' && usuariosQueLoUsan === 0;
  }
}
