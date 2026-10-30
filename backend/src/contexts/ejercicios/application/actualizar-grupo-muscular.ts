import { Inject, Injectable } from '@nestjs/common';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';
import {
  GrupoMuscularNoEncontradoError,
  GrupoMuscularYaExisteAlActualizarError,
  SinCamposParaActualizarGrupoMuscularError,
} from '../domain/errores-ejercicios';
import { NombreGrupoMuscular } from '../domain/nombre-grupo-muscular.vo';

export interface ActualizarGrupoMuscularInput {
  id: number;
  nombre?: string;
}

export interface GrupoMuscularActualizadoResultado {
  id: number;
  nombre: string;
  message: string;
}

@Injectable()
export class ActualizarGrupoMuscular {
  constructor(
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(
    input: ActualizarGrupoMuscularInput,
  ): Promise<GrupoMuscularActualizadoResultado> {
    const grupo = await this.grupoMuscularRepository.buscarPorId(input.id);
    if (!grupo) {
      throw new GrupoMuscularNoEncontradoError(input.id);
    }

    if (typeof input.nombre !== 'string') {
      throw new SinCamposParaActualizarGrupoMuscularError();
    }

    const nuevoNombre = NombreGrupoMuscular.crear(input.nombre);

    const existentes = await this.grupoMuscularRepository.buscarTodos();
    const duplicate = existentes.find(
      (g) => g.id !== input.id && g.nombre.equals(nuevoNombre),
    );

    if (duplicate) {
      throw new GrupoMuscularYaExisteAlActualizarError();
    }

    grupo.renombrar(nuevoNombre);
    const guardado = await this.grupoMuscularRepository.guardar(grupo);

    return {
      id: guardado.id,
      nombre: guardado.nombre.valor,
      message: 'Grupo muscular actualizado correctamente.',
    };
  }
}
