import { Inject, Injectable } from '@nestjs/common';
import {
  HASHER_CONTRASENAS,
  HasherContrasenas,
} from '../../../shared/domain/hasher-contrasenas';
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
    @Inject(HASHER_CONTRASENAS)
    private readonly hasher: HasherContrasenas,
  ) {}

  async ejecutar(comando: RegistrarUsuarioComando): Promise<UsuarioRespuesta> {
    const emailVO = Email.crear(comando.email);

    const usuarioExistente =
      await this.usuarioRepository.buscarPorEmail(emailVO);
    if (usuarioExistente) {
      throw new EmailYaRegistradoError();
    }

    const hashedPassword = await this.hasher.hashear(comando.password);

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
