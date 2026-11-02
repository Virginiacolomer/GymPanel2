import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '../auth';
import { User } from './infrastructure/entities/user.entity';
import { USUARIO_REPOSITORY } from './domain/usuario.repository';
import { TypeOrmUsuarioRepository } from './infrastructure/typeorm-usuario.repository';
import { USUARIOS_QUERY } from './application/puertos/usuarios.query';
import { TypeOrmUsuariosQuery } from './infrastructure/typeorm-usuarios.query';
import { UsuariosController } from './presentation/usuarios.controller';
import { RegistrarUsuario } from './application/registrar-usuario';
import { CambiarEstadoUsuario } from './application/cambiar-estado-usuario';
import { ListarUsuariosPendientes } from './application/listar-usuarios-pendientes';
import { ListarClientesActivos } from './application/listar-clientes-activos';
import { ObtenerUsuario } from './application/obtener-usuario';
import { ListarTodosLosUsuarios } from './application/listar-todos-los-usuarios';
import { EliminarUsuario } from './application/eliminar-usuario';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthGuardsModule],
  controllers: [UsuariosController],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: TypeOrmUsuarioRepository },
    { provide: USUARIOS_QUERY, useClass: TypeOrmUsuariosQuery },
    RegistrarUsuario,
    CambiarEstadoUsuario,
    ListarUsuariosPendientes,
    ListarClientesActivos,
    ObtenerUsuario,
    ListarTodosLosUsuarios,
    EliminarUsuario,
  ],
  exports: [TypeOrmModule, USUARIOS_QUERY, USUARIO_REPOSITORY],
})
export class UsuariosModule {}
