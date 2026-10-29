import { UserRole } from '../../../modules/users/enums/user-role.enum';

// Forma del payload decodificado que JwtAuthGuard deja en request.user.
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest {
  user: JwtPayload;
}
