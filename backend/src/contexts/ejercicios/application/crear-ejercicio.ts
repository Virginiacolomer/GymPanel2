import { Inject, Injectable } from '@nestjs/common';
import { Ejercicio } from '../domain/ejercicio';
import {
  EJERCICIO_REPOSITORY,
  EjercicioRepository,
} from '../domain/ejercicio.repository';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';
import {
  EjercicioYaExisteAlCrearError,
  GrupoMuscularNoEncontradoError,
} from '../domain/errores-ejercicios';
import { NombreEjercicio } from '../domain/nombre-ejercicio.vo';

export interface CrearEjercicioInput {
  nombre: string;
  grupoMuscularId: number;
}

export interface EjercicioCreadoResultado {
  id: number;
  nombre: string;
  grupoMuscularId: number;
  message: string;
}

@Injectable()
export class CrearEjercicio {
  constructor(
    @Inject(EJERCICIO_REPOSITORY)
    private readonly ejercicioRepository: EjercicioRepository,
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(
    input: CrearEjercicioInput,
  ): Promise<EjercicioCreadoResultado> {
    const nombre = NombreEjercicio.crear(input.nombre);
    const grupoId = Number(input.grupoMuscularId);

    const grupo = await this.grupoMuscularRepository.buscarPorId(grupoId);
    if (!grupo) {
      throw new GrupoMuscularNoEncontradoError(grupoId);
    }

    const existentes = await this.ejercicioRepository.buscarTodos();
    const duplicado = existentes.find((e) => e.nombre.equals(nombre));

    if (duplicado) {
      throw new EjercicioYaExisteAlCrearError();
    }

    const ejercicio = Ejercicio.crear({
      id: 0,
      nombre,
      grupoMuscularId: grupoId,
    });

    const guardado = await this.ejercicioRepository.guardar(ejercicio);

    return {
      id: guardado.id,
      nombre: guardado.nombre.valor,
      grupoMuscularId: guardado.grupoMuscularId,
      message: 'Ejercicio creado correctamente.',
    };
  }
}
