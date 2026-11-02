import { Module } from '@nestjs/common';
import { HasherContrasenasModule } from '../../shared/infrastructure/hasher-contrasenas.module';
import { UsuariosModule } from '../usuarios';
import { IniciarSesion } from './application/iniciar-sesion';
import { EMISOR_DE_TOKENS } from './application/puertos/emisor-de-tokens';
import { AuthGuardsModule } from './auth-guards.module';
import { JwtEmisorDeTokens } from './infrastructure/jwt-emisor-de-tokens';
import { AuthController } from './presentation/auth.controller';

// Inicio de sesion. Usa JwtModule (via AuthGuardsModule) para firmar el token
// y UsuariosQuery (via UsuariosModule) para buscar al usuario.
@Module({
  imports: [AuthGuardsModule, UsuariosModule, HasherContrasenasModule],
  controllers: [AuthController],
  providers: [
    IniciarSesion,
    { provide: EMISOR_DE_TOKENS, useClass: JwtEmisorDeTokens },
  ],
})
export class AuthModule {}
