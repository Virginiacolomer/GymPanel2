import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlanEntrenamientoModule } from './modules/plan-entrenamiento/plan-entrenamiento.module';
import { AppController } from './app.controller';
@Module({
  controllers: [AppController],
  providers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres' as const,
          url: configService.get<string>('DATABASE_URL'),
          autoLoadEntities: true,
          synchronize: !isProduction,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: {
            keepAlive: true,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PlanEntrenamientoModule,
  ],
})
export class AppModule {}
