import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios';
import { IniciarSesion } from './application/iniciar-sesion';
import { AuthGuardsModule } from './auth-guards.module';
import { AuthController } from './presentation/auth.controller';

// Inicio de sesion. Usa JwtModule (via AuthGuardsModule) para firmar el token
// y UsuariosQuery (via UsuariosModule) para buscar al usuario.
@Module({
  imports: [AuthGuardsModule, UsuariosModule],
  controllers: [AuthController],
  providers: [IniciarSesion],
})
export class AuthModule {}
