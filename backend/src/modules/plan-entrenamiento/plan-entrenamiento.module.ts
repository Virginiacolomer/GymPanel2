import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntrenamientoService } from './plan-entrenamiento.service';
import { PlanEntrenamientoController } from './plan-entrenamiento.controller';
import { PlanEntrenamiento } from './entities/plan-entrenamiento.entity';
import { User } from '../../contexts/usuarios';
import { AuthGuardsModule } from '../../contexts/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlanEntrenamiento, User]),
    AuthGuardsModule,
  ],
  controllers: [PlanEntrenamientoController],
  providers: [PlanEntrenamientoService],
  exports: [TypeOrmModule],
})
export class PlanEntrenamientoModule {}
