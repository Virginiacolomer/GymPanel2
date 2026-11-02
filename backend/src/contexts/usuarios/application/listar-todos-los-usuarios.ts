import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/usuario.repository';
import {
  mapearAUsuarioRespuesta,
  UsuarioRespuesta,
} from './dtos/usuario-respuesta';

@Injectable()
export class ListarTodosLosUsuarios {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(): Promise<UsuarioRespuesta[]> {
    const usuarios = await this.usuarioRepository.buscarTodos();
    return usuarios.map((user) => mapearAUsuarioRespuesta(user));
  }
}
