import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/usuario.repository';
import { UserStatus } from '../domain/value-objects/estado-usuario.vo';

export interface UsuarioPendienteRespuesta {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  estado: UserStatus;
}

@Injectable()
export class ListarUsuariosPendientes {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(): Promise<UsuarioPendienteRespuesta[]> {
    const usuarios = await this.usuarioRepository.buscarPendientes();
    return usuarios.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      estado: user.estado.valor,
    }));
  }
}
