import { INestApplication, ValidationPipe } from '@nestjs/common';

// Configuracion HTTP global de la app. La usan main.ts y los tests e2e, para
// que los tests ejerciten exactamente la misma app que corre en produccion.
export function configureApp(app: INestApplication): void {
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
}
