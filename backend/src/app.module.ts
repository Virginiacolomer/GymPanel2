import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './contexts/auth/auth.module';
import { PlanEntrenamientoModule } from './modules/plan-entrenamiento/plan-entrenamiento.module';
import { AppController } from './app.controller';
import { databaseOptions } from './database/database-options';
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
          ...databaseOptions(
            configService.get<string>('DATABASE_URL'),
            isProduction,
          ),
          autoLoadEntities: true,
          // Aplica las migraciones pendientes al arrancar (Railway no tiene
          // un paso de deploy aparte para correrlas).
          migrationsRun: true,
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
