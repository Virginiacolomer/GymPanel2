import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '../auth';
import { User } from '../usuarios';
import { PLAN_ENTRENAMIENTO_REPOSITORY } from './domain/plan-entrenamiento.repository';
import { ASIGNACIONES_DE_PLAN } from './application/puertos/asignaciones-de-plan';
import { PlanEntrenamientoOrmEntity } from './infrastructure/plan-entrenamiento.orm-entity';
import { TypeOrmPlanEntrenamientoRepository } from './infrastructure/typeorm-plan-entrenamiento.repository';
import { TypeOrmAsignacionesDePlan } from './infrastructure/typeorm-asignaciones-de-plan';
import { CrearPlan } from './application/crear-plan';
import { ListarPlanesPredeterminados } from './application/listar-planes-predeterminados';
import { ConsultarPlan } from './application/consultar-plan';
import { EditarPlan } from './application/editar-plan';
import { EliminarPlan } from './application/eliminar-plan';
import { AsignarPlan } from './application/asignar-plan';
import { EditarPlanDeUsuario } from './application/editar-plan-de-usuario';
import { ConsultarPlanDeUsuario } from './application/consultar-plan-de-usuario';
import { DescartarPlanSinUso } from './application/descartar-plan-sin-uso';
import { PlanEntrenamientoController } from './presentation/plan-entrenamiento.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanEntrenamientoOrmEntity, User]),
    AuthGuardsModule,
  ],
  controllers: [PlanEntrenamientoController],
  providers: [
    {
      provide: PLAN_ENTRENAMIENTO_REPOSITORY,
      useClass: TypeOrmPlanEntrenamientoRepository,
    },
    {
      provide: ASIGNACIONES_DE_PLAN,
      useClass: TypeOrmAsignacionesDePlan,
    },
    CrearPlan,
    ListarPlanesPredeterminados,
    ConsultarPlan,
    EditarPlan,
    EliminarPlan,
    AsignarPlan,
    EditarPlanDeUsuario,
    ConsultarPlanDeUsuario,
    DescartarPlanSinUso,
  ],
})
export class PlanesModule {}
