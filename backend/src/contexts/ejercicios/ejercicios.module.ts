import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '../auth';
import { EJERCICIO_REPOSITORY } from './domain/ejercicio.repository';
import { GRUPO_MUSCULAR_REPOSITORY } from './domain/grupo-muscular.repository';
import { ALMACENAMIENTO_IMAGENES } from './domain/almacenamiento-imagenes';
import { EjercicioOrmEntity } from './infrastructure/ejercicio.orm-entity';
import { GrupoMuscularOrmEntity } from './infrastructure/grupo-muscular.orm-entity';
import { TypeOrmEjercicioRepository } from './infrastructure/typeorm-ejercicio.repository';
import { TypeOrmGrupoMuscularRepository } from './infrastructure/typeorm-grupo-muscular.repository';
import { SupabaseAlmacenamientoImagenesAdapter } from './infrastructure/supabase-almacenamiento-imagenes.adapter';
import { CrearEjercicio } from './application/crear-ejercicio';
import { ActualizarEjercicio } from './application/actualizar-ejercicio';
import { EliminarEjercicio } from './application/eliminar-ejercicio';
import { BuscarEjercicioPorId } from './application/buscar-ejercicio-por-id';
import { SubirImagenEjercicio } from './application/subir-imagen-ejercicio';
import { CrearGrupoMuscular } from './application/crear-grupo-muscular';
import { ActualizarGrupoMuscular } from './application/actualizar-grupo-muscular';
import { ListarGruposMusculares } from './application/listar-grupos-musculares';
import { ListarGruposMuscularesResumen } from './application/listar-grupos-musculares-resumen';
import { BuscarGrupoMuscularPorId } from './application/buscar-grupo-muscular-por-id';
import { ListarEjerciciosPorGrupo } from './application/listar-ejercicios-por-grupo';
import { EjerciciosController } from './presentation/ejercicios.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EjercicioOrmEntity, GrupoMuscularOrmEntity]),
    AuthGuardsModule,
  ],
  controllers: [EjerciciosController],
  providers: [
    {
      provide: EJERCICIO_REPOSITORY,
      useClass: TypeOrmEjercicioRepository,
    },
    {
      provide: GRUPO_MUSCULAR_REPOSITORY,
      useClass: TypeOrmGrupoMuscularRepository,
    },
    {
      provide: ALMACENAMIENTO_IMAGENES,
      useClass: SupabaseAlmacenamientoImagenesAdapter,
    },
    CrearEjercicio,
    ActualizarEjercicio,
    EliminarEjercicio,
    BuscarEjercicioPorId,
    SubirImagenEjercicio,
    CrearGrupoMuscular,
    ActualizarGrupoMuscular,
    ListarGruposMusculares,
    ListarGruposMuscularesResumen,
    BuscarGrupoMuscularPorId,
    ListarEjerciciosPorGrupo,
  ],
  exports: [TypeOrmModule],
})
export class EjerciciosModule {}
