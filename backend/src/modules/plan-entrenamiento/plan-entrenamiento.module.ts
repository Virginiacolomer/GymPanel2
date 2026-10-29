import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntrenamientoService } from './plan-entrenamiento.service';
import { PlanEntrenamientoController } from './plan-entrenamiento.controller';
import { SupabaseStorageService } from './supabase-storage.service';
import { PlanEntrenamiento } from './entities/plan-entrenamiento.entity';
import { Ejercicio } from './entities/ejercicio.entity';
import { GrupoMuscular } from './entities/grupoMuscular.entity';
import { User } from '../users/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanEntrenamiento,
      Ejercicio,
      GrupoMuscular,
      User,
    ]),
    AuthModule,
  ],
  controllers: [PlanEntrenamientoController],
  providers: [PlanEntrenamientoService, SupabaseStorageService],
  exports: [TypeOrmModule],
})
export class PlanEntrenamientoModule {}
