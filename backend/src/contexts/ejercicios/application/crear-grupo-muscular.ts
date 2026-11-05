import { Inject, Injectable } from '@nestjs/common';
import { GrupoMuscular } from '../domain/grupo-muscular';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';
import { GrupoMuscularYaExisteAlCrearError } from '../domain/errores-ejercicios';
import { NombreGrupoMuscular } from '../domain/nombre-grupo-muscular.vo';

export interface CrearGrupoMuscularInput {
  nombre: string;
}

export interface GrupoMuscularCreadoResultado {
  id: number;
  nombre: string;
  message: string;
}

@Injectable()
export class CrearGrupoMuscular {
  constructor(
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(
    input: CrearGrupoMuscularInput,
  ): Promise<GrupoMuscularCreadoResultado> {
    const nombre = NombreGrupoMuscular.crear(input.nombre);

    const existentes = await this.grupoMuscularRepository.buscarTodos();
    const duplicado = existentes.find((g) => g.nombre.equals(nombre));

    if (duplicado) {
      throw new GrupoMuscularYaExisteAlCrearError();
    }

    const grupo = GrupoMuscular.crear({ id: 0, nombre });
    const guardado = await this.grupoMuscularRepository.guardar(grupo);

    return {
      id: guardado.id,
      nombre: guardado.nombre.valor,
      message: 'Grupo muscular creado correctamente.',
    };
  }
}
