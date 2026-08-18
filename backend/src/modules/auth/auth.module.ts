import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { FeatureGuard } from './feature.guard';
import { GimnasioModule } from '../gimnasio/gimnasio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => GimnasioModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, FeatureGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, FeatureGuard],
})
export class AuthModule {}
