import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuperAdmin } from './entities/superadmin.entity';
import { SuperAdminService } from './superadmin.service';
import { SuperAdminController } from './superadmin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperAdmin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
