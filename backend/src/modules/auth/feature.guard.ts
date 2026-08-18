import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY } from './feature.decorator';
import { Funcionalidad, FUNCIONALIDADES_POR_PLAN } from '../gimnasio/funcionalidades';
import { GimnasioService } from '../gimnasio/gimnasio.service';

// Corre despues de JwtAuthGuard/RolesGuard: esos ya garantizan que hay un
// usuario logueado con el rol correcto. Este guard solo chequea si el plan
// pagado por su gimnasio incluye la funcionalidad pedida.
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly gimnasioService: GimnasioService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<Funcionalidad | undefined>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const gimnasioId = request.user?.gimnasioId;

    if (!gimnasioId) {
      throw new ForbiddenException('Esta accion requiere pertenecer a un gimnasio.');
    }

    const gimnasio = await this.gimnasioService.findActiveById(gimnasioId);
    const funcionalidadesHabilitadas = FUNCIONALIDADES_POR_PLAN[gimnasio.plan] ?? [];

    if (!funcionalidadesHabilitadas.includes(requiredFeature)) {
      throw new ForbiddenException('Esta funcionalidad no esta incluida en el plan de tu gimnasio.');
    }

    return true;
  }
}
