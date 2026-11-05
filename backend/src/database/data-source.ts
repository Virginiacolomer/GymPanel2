import { join } from 'path';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database-options';

// DataSource que usa la CLI de TypeORM (npm run migration:*). La app no lo
// importa: arma su conexion en app.module con las mismas opciones.
export default new DataSource({
  ...databaseOptions(
    process.env.DATABASE_URL,
    process.env.NODE_ENV === 'production',
  ),
  // Los contextos migrados nombran sus entidades *.orm-entity.ts.
  entities: [join(__dirname, '..', '**', '*{.entity,.orm-entity}.{ts,js}')],
});
