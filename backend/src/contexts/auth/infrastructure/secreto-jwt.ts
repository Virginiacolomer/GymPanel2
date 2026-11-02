import { ConfigService } from '@nestjs/config';

const SECRETO_DE_DESARROLLO = 'gympanel-dev-secret';

// En produccion no hay valor por defecto: sin JWT_SECRET el backend no arranca,
// porque firmaria tokens con un secreto publico en el repositorio.
export function resolverSecretoJwt(configService: ConfigService): string {
  const secreto = configService.get<string>('JWT_SECRET');
  if (secreto) {
    return secreto;
  }
  if (configService.get<string>('NODE_ENV') === 'production') {
    throw new Error('Falta la variable de entorno JWT_SECRET.');
  }
  return SECRETO_DE_DESARROLLO;
}
