import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from './entities/horario.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';
import { AuthModule } from '../auth/auth.module';
import { GimnasioModule } from '../gimnasio/gimnasio.module';

@Module({
  imports: [TypeOrmModule.forFeature([Horario]), AuthModule, GimnasioModule],
  controllers: [HorarioController],
  providers: [HorarioService],
  exports: [TypeOrmModule],
})
export class HorarioModule {}
