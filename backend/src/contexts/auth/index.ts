// API publica del contexto Auth: lo unico que otros contextos pueden importar.
// La regla de ESLint de fronteras prohibe importar sus capas internas.
// AuthModule (login) no se exporta aca: solo lo registra app.module, y
// exportarlo crearia un ciclo de imports con Usuarios.
export { AuthGuardsModule } from './auth-guards.module';
export { JwtAuthGuard } from './presentation/jwt-auth.guard';
export { RolesGuard } from './presentation/roles.guard';
export { Roles } from './presentation/roles.decorator';
export type {
  AuthenticatedRequest,
  JwtPayload,
} from './presentation/jwt-payload.interface';
