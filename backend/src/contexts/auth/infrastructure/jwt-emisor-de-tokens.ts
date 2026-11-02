import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DatosDelToken,
  EmisorDeTokens,
} from '../application/puertos/emisor-de-tokens';

// El secreto y la expiracion vienen de la configuracion de JwtModule
// (AuthGuardsModule).
@Injectable()
export class JwtEmisorDeTokens implements EmisorDeTokens {
  constructor(private readonly jwtService: JwtService) {}

  emitir(datos: DatosDelToken): Promise<string> {
    return this.jwtService.signAsync(datos);
  }
}
