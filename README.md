# GymPanel

Sistema de gestion web para administracion de usuarios, membresias y planes de entrenamiento, pensado para poder ofrecerse a distintos gimnasios (cada instancia con su propio backend y base de datos).

## Deploy

### Backend en Railway

1. Crear un nuevo proyecto en Railway desde este repositorio.
2. Configurar el Root Directory del servicio en backend.
3. Railway tomara automaticamente backend/railway.json para build y start.
4. Cargar variables de entorno del archivo backend/.env.example:
	- NODE_ENV=production
	- PORT=3000
	- DATABASE_URL=<postgres de Railway>
	- JWT_SECRET=<secreto fuerte>
	- FRONTEND_URL=<dominio de Vercel>
5. Verificar healthcheck en /health.

### Frontend en Vercel

1. Importar el repositorio en Vercel.
2. Configurar Root Directory en frontend.
3. Vercel usara frontend/vercel.json para build y SPA fallback.
4. Ejecutar deploy.

## Notas

- El frontend en produccion usa src/environments/environment.prod.ts.
- Si cambia la URL del backend en Railway, actualizar frontend/src/environments/environment.prod.ts y redeployar frontend.
