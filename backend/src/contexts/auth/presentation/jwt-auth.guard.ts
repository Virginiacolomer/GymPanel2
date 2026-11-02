import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no provisto.');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token invalido o expirado.');
    }
  }
}
