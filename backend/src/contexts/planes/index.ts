// API publica del contexto Planes: lo unico que otros contextos pueden importar.
// La regla de ESLint de fronteras prohibe importar sus capas internas.
export { PlanesModule } from './planes.module';
export { PlanEntrenamientoOrmEntity } from './persistencia';
