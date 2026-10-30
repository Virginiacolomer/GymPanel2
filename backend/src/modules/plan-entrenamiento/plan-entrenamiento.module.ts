import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntrenamientoService } from './plan-entrenamiento.service';
import { PlanEntrenamientoController } from './plan-entrenamiento.controller';
import { PlanEntrenamiento } from './entities/plan-entrenamiento.entity';
import { User } from '../users/entities/user.entity';
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
