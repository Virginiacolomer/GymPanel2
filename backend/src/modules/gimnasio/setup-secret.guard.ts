import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Protege el alta de gimnasios (tenants) sin necesitar un usuario ya logueado,
// ya que un gimnasio nuevo todavia no tiene ningun admin creado. Se valida
// contra un secreto compartido (GYM_SETUP_SECRET) que solo conoce quien
// administra la plataforma (vos), pasado en el header x-setup-secret.
@Injectable()
export class SetupSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedSecret = request.headers['x-setup-secret'] as string | undefined;
    const expectedSecret = this.configService.get<string>('GYM_SETUP_SECRET');

    if (!expectedSecret) {
      throw new UnauthorizedException(
        'GYM_SETUP_SECRET no esta configurado en el servidor: no se pueden crear gimnasios nuevos.',
      );
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Secreto de configuracion invalido.');
    }

    return true;
  }
}
