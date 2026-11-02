import { Inject, Injectable } from '@nestjs/common';
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
export class ObtenerUsuario {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(id: number): Promise<UsuarioRespuesta> {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) {
      throw new UsuarioNoEncontradoError(id);
    }
    return mapearAUsuarioRespuesta(usuario);
  }
}
