import { GrupoMuscular } from './grupo-muscular';
import { EjercicioResumenDto } from './ejercicio.repository';

export const GRUPO_MUSCULAR_REPOSITORY = Symbol('GRUPO_MUSCULAR_REPOSITORY');

export interface GrupoMuscularConEjerciciosDto {
  id: number;
  nombre: string;
  ejercicios: EjercicioResumenDto[];
}

export interface GrupoMuscularResumenDto {
  id: number;
  nombre: string;
}

export interface GrupoMuscularRepository {
  guardar(grupo: GrupoMuscular): Promise<GrupoMuscular>;
  buscarPorId(id: number): Promise<GrupoMuscular | null>;
  buscarPorIdConEjercicios(
    id: number,
  ): Promise<GrupoMuscularConEjerciciosDto | null>;
  buscarTodosConEjercicios(): Promise<GrupoMuscularConEjerciciosDto[]>;
  buscarTodosResumen(): Promise<GrupoMuscularResumenDto[]>;
  buscarTodos(): Promise<GrupoMuscular[]>;
}
