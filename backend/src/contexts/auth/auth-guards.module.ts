import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './presentation/jwt-auth.guard';
import { RolesGuard } from './presentation/roles.guard';

// Control de acceso que usan los otros contextos (JWT + roles). Esta separado
// del login (AuthModule) para que Usuarios pueda usar los guards y a la vez
// proveerle UsuariosQuery al login, sin dependencia circular.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthGuardsModule {}
