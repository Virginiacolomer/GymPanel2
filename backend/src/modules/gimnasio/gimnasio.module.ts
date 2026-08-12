import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gimnasio } from './entities/gimnasio.entity';
import { GimnasioService } from './gimnasio.service';
import { GimnasioController } from './gimnasio.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  // forwardRef porque AuthModule ya importa GimnasioModule (para validar el
  // gimnasio en el login) y esto crearia una dependencia circular directa.
  imports: [TypeOrmModule.forFeature([Gimnasio]), forwardRef(() => AuthModule)],
  controllers: [GimnasioController],
  providers: [GimnasioService],
  exports: [TypeOrmModule, GimnasioService],
})
export class GimnasioModule {}
