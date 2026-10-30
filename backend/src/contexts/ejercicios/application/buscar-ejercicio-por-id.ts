import { Inject, Injectable } from '@nestjs/common';
import {
  EJERCICIO_REPOSITORY,
  EjercicioRepository,
} from '../domain/ejercicio.repository';
import { EjercicioNoEncontradoError } from '../domain/errores-ejercicios';

export interface EjercicioDetalleResultado {
  id: number;
  nombre: string;
  imagenUrl: string | null;
}

@Injectable()
export class BuscarEjercicioPorId {
  constructor(
    @Inject(EJERCICIO_REPOSITORY)
    private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async ejecutar(id: number): Promise<EjercicioDetalleResultado> {
    const ejercicio = await this.ejercicioRepository.buscarPorId(id);
    if (!ejercicio) {
      throw new EjercicioNoEncontradoError(id);
    }

    return {
      id: ejercicio.id,
      nombre: ejercicio.nombre.valor,
      imagenUrl: ejercicio.imagenUrl,
    };
  }
}
