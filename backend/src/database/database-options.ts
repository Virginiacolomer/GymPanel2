import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

// Opciones de conexion compartidas por la app (app.module) y por la CLI de
// TypeORM (data-source.ts), para que las dos apunten a la misma base y usen
// las mismas migraciones.
//
// synchronize queda apagado: el esquema cambia solo por migracion.
export function databaseOptions(
  databaseUrl: string | undefined,
  isProduction: boolean,
): DataSourceOptions {
  return {
    type: 'postgres',
    url: databaseUrl,
    synchronize: false,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    extra: {
      keepAlive: true,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    },
  };
}
