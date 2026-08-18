import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembresiaService } from './membresia.service';
import { MembresiaController } from './membresia.controller';
import { Membresia } from './entities/membresia.entity';
import { Pago } from './entities/pago.entity';
import { UserMembresia } from './entities/userMembresia.entity';
import { EstadoUserMembresia } from './entities/estadoUserMembresia.entity';
import { AuthModule } from '../auth/auth.module';
import { GimnasioModule } from '../gimnasio/gimnasio.module';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membresia, Pago, UserMembresia, EstadoUserMembresia]),
    AuthModule,
    GimnasioModule,
  ],
  controllers: [MembresiaController],
  providers: [MembresiaService, MercadoPagoService],
  exports: [TypeOrmModule],
})
export class MembresiaModule {}
