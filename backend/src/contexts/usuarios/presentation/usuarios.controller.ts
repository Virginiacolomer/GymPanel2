import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth';
import { UserRole } from '../domain/value-objects/rol.vo';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { RegistrarUsuario } from '../application/registrar-usuario';
import { CambiarEstadoUsuario } from '../application/cambiar-estado-usuario';
import { ListarUsuariosPendientes } from '../application/listar-usuarios-pendientes';
import { ListarClientesActivos } from '../application/listar-clientes-activos';
import { ObtenerUsuario } from '../application/obtener-usuario';
import { ListarTodosLosUsuarios } from '../application/listar-todos-los-usuarios';
import { EliminarUsuario } from '../application/eliminar-usuario';

@Controller('users')
export class UsuariosController {
  constructor(
    private readonly registrarUsuario: RegistrarUsuario,
    private readonly cambiarEstadoUsuario: CambiarEstadoUsuario,
    private readonly listarPendientes: ListarUsuariosPendientes,
    private readonly listarClientesActivos: ListarClientesActivos,
    private readonly obtenerUsuario: ObtenerUsuario,
    private readonly listarTodos: ListarTodosLosUsuarios,
    private readonly eliminarUsuario: EliminarUsuario,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.registrarUsuario.ejecutar(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.listarTodos.ejecutar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('pendientes')
  findPending() {
    return this.listarPendientes.ejecutar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('clientes-activos')
  findActiveClients() {
    return this.listarClientesActivos.ejecutar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.obtenerUsuario.ejecutar(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/estado')
  updateEstado(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    return this.cambiarEstadoUsuario.ejecutar(+id, body.estado);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eliminarUsuario.ejecutar(+id);
  }
}
