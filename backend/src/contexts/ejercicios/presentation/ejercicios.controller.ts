import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, Roles, RolesGuard } from '../../auth';
import { UserRole } from '../../../modules/users/enums/user-role.enum';
import { CreateEjercicioDto } from './create-ejercicio.dto';
import { UpdateEjercicioDto } from './update-ejercicio.dto';
import { CreateGrupoMuscularDto } from './create-grupo-muscular.dto';
import { UpdateGrupoMuscularDto } from './update-grupo-muscular.dto';
import { CrearEjercicio } from '../application/crear-ejercicio';
import { ActualizarEjercicio } from '../application/actualizar-ejercicio';
import { EliminarEjercicio } from '../application/eliminar-ejercicio';
import { BuscarEjercicioPorId } from '../application/buscar-ejercicio-por-id';
import { SubirImagenEjercicio } from '../application/subir-imagen-ejercicio';
import { CrearGrupoMuscular } from '../application/crear-grupo-muscular';
import { ActualizarGrupoMuscular } from '../application/actualizar-grupo-muscular';
import { ListarGruposMusculares } from '../application/listar-grupos-musculares';
import { ListarGruposMuscularesResumen } from '../application/listar-grupos-musculares-resumen';
import { BuscarGrupoMuscularPorId } from '../application/buscar-grupo-muscular-por-id';
import { ListarEjerciciosPorGrupo } from '../application/listar-ejercicios-por-grupo';

@Controller('plan-entrenamiento')
export class EjerciciosController {
  constructor(
    private readonly crearEjercicioUseCase: CrearEjercicio,
    private readonly actualizarEjercicioUseCase: ActualizarEjercicio,
    private readonly eliminarEjercicioUseCase: EliminarEjercicio,
    private readonly buscarEjercicioPorIdUseCase: BuscarEjercicioPorId,
    private readonly subirImagenEjercicioUseCase: SubirImagenEjercicio,
    private readonly crearGrupoMuscularUseCase: CrearGrupoMuscular,
    private readonly actualizarGrupoMuscularUseCase: ActualizarGrupoMuscular,
    private readonly listarGruposMuscularesUseCase: ListarGruposMusculares,
    private readonly listarGruposMuscularesResumenUseCase: ListarGruposMuscularesResumen,
    private readonly buscarGrupoMuscularPorIdUseCase: BuscarGrupoMuscularPorId,
    private readonly listarEjerciciosPorGrupoUseCase: ListarEjerciciosPorGrupo,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('ejercicios')
  createEjercicio(@Body() createEjercicioDto: CreateEjercicioDto) {
    return this.crearEjercicioUseCase.ejecutar(createEjercicioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('grupos-musculares')
  createGrupoMuscular(@Body() createGrupoMuscularDto: CreateGrupoMuscularDto) {
    return this.crearGrupoMuscularUseCase.ejecutar(createGrupoMuscularDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('ejercicios/:id')
  updateEjercicio(
    @Param('id') id: string,
    @Body() updateEjercicioDto: UpdateEjercicioDto,
  ) {
    return this.actualizarEjercicioUseCase.ejecutar({
      id: +id,
      ...updateEjercicioDto,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('ejercicios/:id')
  removeEjercicio(@Param('id') id: string) {
    return this.eliminarEjercicioUseCase.ejecutar(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('ejercicios/:id/imagen')
  @UseInterceptors(
    FileInterceptor('imagen', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadEjercicioImagen(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        .build({
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
          fileIsRequired: true,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.subirImagenEjercicioUseCase.ejecutar(
      +id,
      file ? { mimetype: file.mimetype, buffer: file.buffer } : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('grupos-musculares/:id')
  updateGrupoMuscular(
    @Param('id') id: string,
    @Body() updateGrupoMuscularDto: UpdateGrupoMuscularDto,
  ) {
    return this.actualizarGrupoMuscularUseCase.ejecutar({
      id: +id,
      ...updateGrupoMuscularDto,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('ejercicios/:id')
  findEjercicioById(@Param('id') id: string) {
    return this.buscarEjercicioPorIdUseCase.ejecutar(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares/:id')
  findGrupoMuscularById(@Param('id') id: string) {
    return this.buscarGrupoMuscularPorIdUseCase.ejecutar(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares/:id/ejercicios')
  findEjerciciosByGrupoMuscularId(@Param('id') id: string) {
    return this.listarEjerciciosPorGrupoUseCase.ejecutar(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares-resumen')
  findGruposMuscularesResumen() {
    return this.listarGruposMuscularesResumenUseCase.ejecutar();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares')
  findGruposMusculares() {
    return this.listarGruposMuscularesUseCase.ejecutar();
  }
}
