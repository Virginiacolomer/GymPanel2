import { Inject, Injectable } from '@nestjs/common';
import {
  HASHER_CONTRASENAS,
  HasherContrasenas,
} from '../../../shared/domain/hasher-contrasenas';
import {
  USUARIOS_QUERY,
  UsuarioConCredenciales,
  UsuariosQuery,
} from '../../usuarios/contrato';
import {
  ContrasenaIncorrectaError,
  EmailNoRegistradoError,
} from '../domain/errores-autenticacion';
import { asegurarQuePuedeIniciarSesion } from '../domain/politica-de-acceso';
import { EMISOR_DE_TOKENS, EmisorDeTokens } from './puertos/emisor-de-tokens';

export interface SesionIniciada {
  accessToken: string;
  user: Omit<UsuarioConCredenciales, 'passwordHash'>;
}

// Caso de uso: iniciar sesion con email y contrasena. Orquesta; las reglas
// estan en el dominio (politica-de-acceso) y los datos del usuario los da el
// contexto Usuarios por su puerto (UsuariosQuery).
@Injectable()
export class IniciarSesion {
  constructor(
    @Inject(USUARIOS_QUERY)
    private readonly usuarios: UsuariosQuery,
    @Inject(HASHER_CONTRASENAS)
    private readonly hasher: HasherContrasenas,
    @Inject(EMISOR_DE_TOKENS)
    private readonly emisorDeTokens: EmisorDeTokens,
  ) {}

  async ejecutar(email: string, password: string): Promise<SesionIniciada> {
    const usuario = await this.usuarios.buscarPorEmail(
      email.trim().toLowerCase(),
    );
    if (!usuario) {
      throw new EmailNoRegistradoError();
    }

    if (!(await this.hasher.comparar(password, usuario.passwordHash))) {
      throw new ContrasenaIncorrectaError();
    }

    asegurarQuePuedeIniciarSesion(usuario.estado);

    const accessToken = await this.emisorDeTokens.emitir({
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    });

    const { passwordHash, ...user } = usuario;
    return { accessToken, user };
  }
}
