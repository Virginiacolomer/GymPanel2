import { Ejercicio } from './ejercicio';

export const EJERCICIO_REPOSITORY = Symbol('EJERCICIO_REPOSITORY');

export interface EjercicioResumenDto {
  id: number;
  nombre: string;
  imagenUrl: string | null;
}

export interface EjercicioRepository {
  guardar(ejercicio: Ejercicio): Promise<Ejercicio>;
  buscarPorId(id: number): Promise<Ejercicio | null>;
  buscarTodos(): Promise<Ejercicio[]>;
  buscarPorGrupoMuscularId(
    grupoMuscularId: number,
  ): Promise<EjercicioResumenDto[]>;
  eliminar(id: number): Promise<void>;
}
