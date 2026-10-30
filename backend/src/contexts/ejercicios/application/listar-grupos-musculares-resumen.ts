import { Inject, Injectable } from '@nestjs/common';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularRepository,
  GrupoMuscularResumenDto,
} from '../domain/grupo-muscular.repository';

@Injectable()
export class ListarGruposMuscularesResumen {
  constructor(
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(): Promise<GrupoMuscularResumenDto[]> {
    return this.grupoMuscularRepository.buscarTodosResumen();
  }
}
