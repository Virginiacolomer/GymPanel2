import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  USUARIOS_QUERY,
  UsuarioConCredenciales,
  UsuariosQuery,
} from '../../usuarios';
import {
  ContrasenaIncorrectaError,
  EmailNoRegistradoError,
} from '../domain/errores-autenticacion';
import { asegurarQuePuedeIniciarSesion } from '../domain/politica-de-acceso';

export interface SesionIniciada {
  accessToken: string;
  user: Omit<UsuarioConCredenciales, 'passwordHash'>;
}

// Caso de uso: iniciar sesion con email y contrasena. Orquesta; las reglas
// estan en el dominio (politica-de-acceso) y los datos del usuario los da el
// contexto Usuarios por su puerto (UsuariosQuery).
//
// Deuda de la Fase 2: bcrypt y JwtService se usan directo; pasarlos a puertos
// (HasherContrasenas, emisor de tokens).
@Injectable()
export class IniciarSesion {
  constructor(
    @Inject(USUARIOS_QUERY)
    private readonly usuarios: UsuariosQuery,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async ejecutar(email: string, password: string): Promise<SesionIniciada> {
    const usuario = await this.usuarios.buscarPorEmail(
      email.trim().toLowerCase(),
    );
    if (!usuario) {
      throw new EmailNoRegistradoError();
    }

    if (!(await bcrypt.compare(password, usuario.passwordHash))) {
      throw new ContrasenaIncorrectaError();
    }

    asegurarQuePuedeIniciarSesion(usuario.estado);

    const accessToken = await this.jwtService.signAsync(
      { sub: usuario.id, email: usuario.email, role: usuario.role },
      {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
      },
    );

    const { passwordHash, ...user } = usuario;
    return { accessToken, user };
  }
}
