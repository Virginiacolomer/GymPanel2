import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';

// Seed minimo para desarrollo: crea un usuario ADMIN activo, que es lo unico
// que no se puede dar de alta desde la API (el registro siempre crea
// clientes). Es idempotente: si el email ya existe no hace nada.
//
// Uso: SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed
async function seed(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en el entorno.',
    );
  }

  await dataSource.initialize();
  try {
    const existing: unknown[] = await dataSource.query(
      'SELECT id FROM "public"."user" WHERE email = $1',
      [email],
    );

    if (existing.length > 0) {
      console.log(`[seed] El admin ${email} ya existe, no se crea de nuevo.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await dataSource.query(
      `INSERT INTO "public"."user" (nombre, apellido, dni, email, password_hash, role, estado)
       VALUES ('Admin', 'GymPanel', '0', $1, $2, 'ADMIN', 'activo')`,
      [email, passwordHash],
    );
    console.log(`[seed] Admin ${email} creado.`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('[seed] Error:', error);
  process.exit(1);
});
