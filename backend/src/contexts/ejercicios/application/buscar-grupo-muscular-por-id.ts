import { Inject, Injectable } from '@nestjs/common';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularConEjerciciosDto,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';
import { GrupoMuscularNoEncontradoError } from '../domain/errores-ejercicios';

@Injectable()
export class BuscarGrupoMuscularPorId {
  constructor(
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(id: number): Promise<GrupoMuscularConEjerciciosDto> {
    const grupo =
      await this.grupoMuscularRepository.buscarPorIdConEjercicios(id);

    if (!grupo) {
      throw new GrupoMuscularNoEncontradoError(id);
    }

    return grupo;
  }
}
