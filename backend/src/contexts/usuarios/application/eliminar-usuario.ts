import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/usuario.repository';
import { UsuarioNoEncontradoError } from '../domain/errores-usuario';

@Injectable()
export class EliminarUsuario {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(id: number): Promise<{ message: string }> {
    const eliminado = await this.usuarioRepository.eliminar(id);
    if (!eliminado) {
      throw new UsuarioNoEncontradoError(id);
    }
    return { message: 'Usuario eliminado correctamente.' };
  }
}
