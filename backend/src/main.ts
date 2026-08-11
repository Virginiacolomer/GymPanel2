import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS para frontend (Vercel) y pruebas locales.
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Activa validaciones de class-validator en todos los DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  console.log(`API running on port ${port}`);
}

bootstrap();