import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gimnasio } from './entities/gimnasio.entity';
import { GimnasioService } from './gimnasio.service';
import { GimnasioController } from './gimnasio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Gimnasio])],
  controllers: [GimnasioController],
  providers: [GimnasioService],
  exports: [TypeOrmModule, GimnasioService],
})
export class GimnasioModule {}
