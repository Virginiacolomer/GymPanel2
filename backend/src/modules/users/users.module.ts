import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuthGuardsModule } from '../../contexts/auth';
import { TypeOrmUsuariosQuery } from './typeorm-usuarios.query';
import { USUARIOS_QUERY } from './usuarios.query';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthGuardsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USUARIOS_QUERY, useClass: TypeOrmUsuariosQuery },
  ],
  exports: [TypeOrmModule, USUARIOS_QUERY],
})
export class UsersModule {}
