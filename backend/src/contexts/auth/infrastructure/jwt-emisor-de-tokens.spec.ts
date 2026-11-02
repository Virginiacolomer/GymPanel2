import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../usuarios/contrato';
import { JwtEmisorDeTokens } from './jwt-emisor-de-tokens';

describe('JwtEmisorDeTokens', () => {
  const jwtService = new JwtService({
    secret: 'secreto-de-test',
    signOptions: { expiresIn: '12h' },
  });

  it('firma los datos con la configuracion de JwtModule', async () => {
    const token = await new JwtEmisorDeTokens(jwtService).emitir({
      sub: 7,
      email: 'tomas@mail.com',
      role: UserRole.CLIENTE,
    });

    const payload = jwtService.verify<{ iat: number; exp: number }>(token);
    expect(payload).toMatchObject({
      sub: 7,
      email: 'tomas@mail.com',
      role: 'CLIENTE',
    });
    expect(payload.exp - payload.iat).toBe(12 * 60 * 60);
  });
});
