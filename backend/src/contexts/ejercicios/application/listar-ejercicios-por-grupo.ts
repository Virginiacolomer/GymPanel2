import { Inject, Injectable } from '@nestjs/common';
import {
  EJERCICIO_REPOSITORY,
  EjercicioRepository,
  EjercicioResumenDto,
} from '../domain/ejercicio.repository';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';
import {
  GrupoMuscularIdInvalidoError,
  GrupoMuscularNoEncontradoError,
} from '../domain/errores-ejercicios';

@Injectable()
export class ListarEjerciciosPorGrupo {
  constructor(
    @Inject(EJERCICIO_REPOSITORY)
    private readonly ejercicioRepository: EjercicioRepository,
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(grupoMuscularId: number): Promise<EjercicioResumenDto[]> {
    const normalizedGroupId = Number(grupoMuscularId);

    if (!Number.isInteger(normalizedGroupId) || normalizedGroupId <= 0) {
      throw new GrupoMuscularIdInvalidoError();
    }

    const grupo =
      await this.grupoMuscularRepository.buscarPorId(normalizedGroupId);
    if (!grupo) {
      throw new GrupoMuscularNoEncontradoError(normalizedGroupId);
    }

    return this.ejercicioRepository.buscarPorGrupoMuscularId(normalizedGroupId);
  }
}
