import { UserRole } from '../../usuarios/contrato';

// Forma del payload decodificado que JwtAuthGuard deja en request.user.
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
}
