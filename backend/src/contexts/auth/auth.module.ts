import { Module } from '@nestjs/common';
import { UsersModule } from '../../modules/users/users.module';
import { IniciarSesion } from './application/iniciar-sesion';
import { AuthGuardsModule } from './auth-guards.module';
import { AuthController } from './presentation/auth.controller';

// Inicio de sesion. Usa JwtModule (via AuthGuardsModule) para firmar el token
// y UsuariosQuery (via UsersModule) para buscar al usuario.
@Module({
  imports: [AuthGuardsModule, UsersModule],
  controllers: [AuthController],
  providers: [IniciarSesion],
})
export class AuthModule {}
