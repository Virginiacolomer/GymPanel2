// API publica del contexto Ejercicios: lo unico que otros contextos pueden importar.
// La regla de ESLint de fronteras prohibe importar sus capas internas.
export { EjerciciosModule } from './ejercicios.module';
export {
  ALMACENAMIENTO_IMAGENES,
  type AlmacenamientoImagenes,
  type ArchivoImagen,
} from './domain/almacenamiento-imagenes';
export { EjercicioOrmEntity } from './infrastructure/ejercicio.orm-entity';
export { GrupoMuscularOrmEntity } from './infrastructure/grupo-muscular.orm-entity';
