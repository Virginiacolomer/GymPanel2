export const ALMACENAMIENTO_IMAGENES = Symbol('ALMACENAMIENTO_IMAGENES');

export interface ArchivoImagen {
  mimetype: string;
  buffer: Buffer;
}

export interface AlmacenamientoImagenes {
  subirImagen(ejercicioId: number, archivo: ArchivoImagen): Promise<string>;
  eliminarImagen(imagenUrl: string): Promise<void>;
}
