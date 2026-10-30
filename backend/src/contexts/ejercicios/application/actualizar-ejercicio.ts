import { Inject, Injectable } from '@nestjs/common';
import {
  EJERCICIO_REPOSITORY,
  EjercicioRepository,
} from '../domain/ejercicio.repository';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';
import {
  EjercicioNoEncontradoError,
  EjercicioYaExisteAlActualizarError,
  GrupoMuscularNoEncontradoError,
  SinCamposParaActualizarEjercicioError,
} from '../domain/errores-ejercicios';
import { NombreEjercicio } from '../domain/nombre-ejercicio.vo';

export interface ActualizarEjercicioInput {
  id: number;
  nombre?: string;
  grupoMuscularId?: number;
}

export interface EjercicioActualizadoResultado {
  id: number;
  nombre: string;
  grupoMuscularId: number;
  message: string;
}

@Injectable()
export class ActualizarEjercicio {
  constructor(
    @Inject(EJERCICIO_REPOSITORY)
    private readonly ejercicioRepository: EjercicioRepository,
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(
    input: ActualizarEjercicioInput,
  ): Promise<EjercicioActualizadoResultado> {
    const ejercicio = await this.ejercicioRepository.buscarPorId(input.id);
    if (!ejercicio) {
      throw new EjercicioNoEncontradoError(input.id);
    }

    const hasNombre = typeof input.nombre === 'string';
    const hasGrupoMuscularId = input.grupoMuscularId !== undefined;

    if (!hasNombre && !hasGrupoMuscularId) {
      throw new SinCamposParaActualizarEjercicioError();
    }

    if (hasNombre) {
      const nuevoNombre = NombreEjercicio.crear(input.nombre!);

      const existentes = await this.ejercicioRepository.buscarTodos();
      const duplicado = existentes.find(
        (item) => item.id !== input.id && item.nombre.equals(nuevoNombre),
      );

      if (duplicado) {
        throw new EjercicioYaExisteAlActualizarError();
      }

      ejercicio.renombrar(nuevoNombre);
    }

    if (hasGrupoMuscularId) {
      const grupoId = Number(input.grupoMuscularId);
      const grupo = await this.grupoMuscularRepository.buscarPorId(grupoId);

      if (!grupo) {
        throw new GrupoMuscularNoEncontradoError(grupoId);
      }

      ejercicio.cambiarGrupoMuscular(grupoId);
    }

    const guardado = await this.ejercicioRepository.guardar(ejercicio);

    return {
      id: guardado.id,
      nombre: guardado.nombre.valor,
      grupoMuscularId: guardado.grupoMuscularId,
      message: 'Ejercicio actualizado correctamente.',
    };
  }
}
