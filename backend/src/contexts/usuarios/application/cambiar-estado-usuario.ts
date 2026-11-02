import { Inject, Injectable } from '@nestjs/common';
import {
  EstadoUsuario,
  UserStatus,
} from '../domain/value-objects/estado-usuario.vo';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/usuario.repository';
import { UsuarioNoEncontradoError } from '../domain/errores-usuario';
import {
  mapearAUsuarioRespuesta,
  UsuarioRespuesta,
} from './dtos/usuario-respuesta';

@Injectable()
export class CambiarEstadoUsuario {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(
    id: number,
    nuevoEstado: string | UserStatus,
  ): Promise<UsuarioRespuesta> {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoError(id);
    }

    const estadoVO = EstadoUsuario.crear(nuevoEstado);
    usuario.cambiarEstado(estadoVO);

    const guardado = await this.usuarioRepository.guardar(usuario);
    return mapearAUsuarioRespuesta(guardado);
  }
}
