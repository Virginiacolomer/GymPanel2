import { Inject, Injectable } from '@nestjs/common';
import {
  GRUPO_MUSCULAR_REPOSITORY,
  GrupoMuscularConEjerciciosDto,
  GrupoMuscularRepository,
} from '../domain/grupo-muscular.repository';

@Injectable()
export class ListarGruposMusculares {
  constructor(
    @Inject(GRUPO_MUSCULAR_REPOSITORY)
    private readonly grupoMuscularRepository: GrupoMuscularRepository,
  ) {}

  async ejecutar(): Promise<GrupoMuscularConEjerciciosDto[]> {
    return this.grupoMuscularRepository.buscarTodosConEjercicios();
  }
}
