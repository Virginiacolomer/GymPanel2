import { Inject, Injectable } from '@nestjs/common';
import {
  EJERCICIO_REPOSITORY,
  EjercicioRepository,
} from '../domain/ejercicio.repository';
import { EjercicioNoEncontradoError } from '../domain/errores-ejercicios';

export interface EjercicioEliminadoResultado {
  id: number;
  message: string;
}

@Injectable()
export class EliminarEjercicio {
  constructor(
    @Inject(EJERCICIO_REPOSITORY)
    private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async ejecutar(id: number): Promise<EjercicioEliminadoResultado> {
    const ejercicio = await this.ejercicioRepository.buscarPorId(id);
    if (!ejercicio) {
      throw new EjercicioNoEncontradoError(id);
    }

    await this.ejercicioRepository.eliminar(id);

    return {
      id,
      message: 'Ejercicio eliminado correctamente.',
    };
  }
}
