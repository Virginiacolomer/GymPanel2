import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from './entities/horario.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Horario]), AuthModule],
  controllers: [HorarioController],
  providers: [HorarioService],
  exports: [TypeOrmModule],
})
export class HorarioModule {}
