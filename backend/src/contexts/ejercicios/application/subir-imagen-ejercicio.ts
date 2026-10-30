import { Inject, Injectable } from '@nestjs/common';
import {
  ALMACENAMIENTO_IMAGENES,
  AlmacenamientoImagenes,
  ArchivoImagen,
} from '../domain/almacenamiento-imagenes';
import {
  EJERCICIO_REPOSITORY,
  EjercicioRepository,
} from '../domain/ejercicio.repository';
import {
  ArchivoImagenObligatorioError,
  EjercicioNoEncontradoError,
} from '../domain/errores-ejercicios';

export interface SubirImagenEjercicioResultado {
  id: number;
  imagenUrl: string;
  message: string;
}

@Injectable()
export class SubirImagenEjercicio {
  constructor(
    @Inject(EJERCICIO_REPOSITORY)
    private readonly ejercicioRepository: EjercicioRepository,
    @Inject(ALMACENAMIENTO_IMAGENES)
    private readonly storage: AlmacenamientoImagenes,
  ) {}

  async ejecutar(
    id: number,
    archivo?: ArchivoImagen,
  ): Promise<SubirImagenEjercicioResultado> {
    const ejercicio = await this.ejercicioRepository.buscarPorId(id);
    if (!ejercicio) {
      throw new EjercicioNoEncontradoError(id);
    }

    if (!archivo) {
      throw new ArchivoImagenObligatorioError();
    }

    const imagenAnteriorUrl = ejercicio.imagenUrl;
    const imagenUrl = await this.storage.subirImagen(id, archivo);

    ejercicio.actualizarImagen(imagenUrl);
    await this.ejercicioRepository.guardar(ejercicio);

    if (imagenAnteriorUrl && imagenAnteriorUrl !== imagenUrl) {
      await this.storage.eliminarImagen(imagenAnteriorUrl);
    }

    return {
      id,
      imagenUrl,
      message: 'Imagen actualizada correctamente.',
    };
  }
}
