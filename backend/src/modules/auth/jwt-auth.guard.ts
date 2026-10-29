import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization as
      | string
      | undefined;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no provisto.');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();

    try {
      request.user = await this.jwtService.verifyAsync(token, {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
      });
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido o expirado.');
    }
  }
}
