import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Email } from '../domain/value-objects/email.vo';
import { Usuario } from '../domain/usuario';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/usuario.repository';
import { EmailYaRegistradoError } from '../domain/errores-usuario';
import {
  mapearAUsuarioRespuesta,
  UsuarioRespuesta,
} from './dtos/usuario-respuesta';

export interface RegistrarUsuarioComando {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
}

@Injectable()
export class RegistrarUsuario {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(comando: RegistrarUsuarioComando): Promise<UsuarioRespuesta> {
    const emailVO = Email.crear(comando.email);

    const usuarioExistente =
      await this.usuarioRepository.buscarPorEmail(emailVO);
    if (usuarioExistente) {
      throw new EmailYaRegistradoError();
    }

    const defaultRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const configuredRounds = Number(
      process.env.BCRYPT_SALT_ROUNDS ?? defaultRounds,
    );
    const saltRounds =
      Number.isFinite(configuredRounds) && configuredRounds > 3
        ? configuredRounds
        : defaultRounds;

    const hashedPassword = await bcrypt.hash(comando.password, saltRounds);

    const nuevoUsuario = Usuario.nuevo({
      nombre: comando.nombre,
      apellido: comando.apellido,
      dni: comando.dni,
      email: emailVO,
      passwordHash: hashedPassword,
    });

    const guardado = await this.usuarioRepository.guardar(nuevoUsuario);
    return mapearAUsuarioRespuesta(guardado);
  }
}
