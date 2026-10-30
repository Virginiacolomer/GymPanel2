import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AlmacenamientoImagenes,
  ArchivoImagen,
} from '../domain/almacenamiento-imagenes';

const EXTENSION_BY_MIMETYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class SupabaseAlmacenamientoImagenesAdapter implements AlmacenamientoImagenes {
  private readonly logger = new Logger(
    SupabaseAlmacenamientoImagenesAdapter.name,
  );
  private readonly client: SupabaseClient | null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    // SUPABASE_SECRET_KEY es el nombre nuevo de Supabase para la clave con
    // privilegios de servidor; SUPABASE_SERVICE_ROLE_KEY queda como fallback
    // por si el entorno desplegado todavia usa el nombre viejo.
    const secretKey =
      this.configService.get<string>('SUPABASE_SECRET_KEY') ||
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      'ejercicios-imagenes';

    this.client =
      supabaseUrl && secretKey
        ? createClient(supabaseUrl, secretKey, {
            auth: { persistSession: false },
          })
        : null;

    if (!this.client) {
      this.logger.warn(
        'SUPABASE_URL/SUPABASE_SECRET_KEY no configuradas. La subida de imagenes de ejercicios fallara.',
      );
    }
  }

  async subirImagen(
    ejercicioId: number,
    archivo: ArchivoImagen,
  ): Promise<string> {
    if (!this.client) {
      throw new InternalServerErrorException(
        'El almacenamiento de imagenes no esta configurado en el servidor.',
      );
    }

    const extension = EXTENSION_BY_MIMETYPE[archivo.mimetype] ?? 'jpg';
    const path = `ejercicios/${ejercicioId}-${Date.now()}.${extension}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, archivo.buffer, {
        contentType: archivo.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Error al subir imagen de ejercicio ${ejercicioId} a Supabase Storage: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'No se pudo subir la imagen. Intenta de nuevo.',
      );
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async eliminarImagen(imageUrl: string): Promise<void> {
    if (!this.client) {
      return;
    }

    const path = this.extractStoragePath(imageUrl);
    if (!path) {
      return;
    }

    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      this.logger.warn(
        `No se pudo borrar la imagen anterior (${path}) de Supabase Storage: ${error.message}`,
      );
    }
  }

  private extractStoragePath(imageUrl: string): string | null {
    const marker = `/object/public/${this.bucket}/`;
    const markerIndex = imageUrl.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
  }
}

export { SupabaseAlmacenamientoImagenesAdapter as SupabaseStorageService };
