// Entidad TypeORM de plan_entrenamiento, separada de index.ts para la clave
// foranea user.plan_entrenamiento_id del contexto Usuarios. index.ts exporta
// PlanesModule, que a su vez importa Usuarios: si User importara index.ts se
// formaria un ciclo de imports.
export { PlanEntrenamientoOrmEntity } from './infrastructure/plan-entrenamiento.orm-entity';
