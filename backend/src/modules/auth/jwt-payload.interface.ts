import { UserRole } from '../users/enums/user-role.enum';

// Forma del payload decodificado que JwtAuthGuard deja en request.user.
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  gimnasioId: number;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
}

// El superadmin no pertenece a ningun gimnasio, asi que su payload no lleva
// gimnasioId (a diferencia de JwtPayload, que siempre lo requiere).
export interface SuperAdminJwtPayload {
  sub: number;
  email: string;
  role: UserRole.SUPERADMIN;
}

export interface AuthenticatedSuperAdminRequest {
  user: SuperAdminJwtPayload;
}
