import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_REPOSITORY,
  UsuarioRepository,
} from '../domain/usuario.repository';
import { UserStatus } from '../domain/value-objects/estado-usuario.vo';

export interface ClienteActivoRespuesta {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  estado: UserStatus;
}

@Injectable()
export class ListarClientesActivos {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async ejecutar(): Promise<ClienteActivoRespuesta[]> {
    const usuarios = await this.usuarioRepository.buscarClientesActivos();
    return usuarios.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      dni: user.dni,
      email: user.email.valor,
      estado: user.estado.valor,
    }));
  }
}
