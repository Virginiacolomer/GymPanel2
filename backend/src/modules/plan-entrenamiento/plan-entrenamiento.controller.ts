import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlanEntrenamientoService } from './plan-entrenamiento.service';
import { CreatePlanEntrenamientoDto } from './dto/create-plan-entrenamiento.dto';
import { UpdatePlanEntrenamientoDto } from './dto/update-plan-entrenamiento.dto';
import { CreateEjercicioDto } from './dto/create-ejercicio.dto';
import { CreateGrupoMuscularDto } from './dto/create-grupo-muscular.dto';
import { UpdateEjercicioDto } from './dto/update-ejercicio.dto';
import { UpdateGrupoMuscularDto } from './dto/update-grupo-muscular.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FeatureGuard } from '../auth/feature.guard';
import { RequireFeature } from '../auth/feature.decorator';
import { Funcionalidad } from '../gimnasio/funcionalidades';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../auth/jwt-payload.interface';

@Controller('plan-entrenamiento')
export class PlanEntrenamientoController {
  constructor(private readonly planEntrenamientoService: PlanEntrenamientoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CREACION_PLANES)
  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createPlanEntrenamientoDto: CreatePlanEntrenamientoDto) {
    return this.planEntrenamientoService.create(request.user.gimnasioId, createPlanEntrenamientoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Post('ejercicios')
  createEjercicio(@Req() request: AuthenticatedRequest, @Body() createEjercicioDto: CreateEjercicioDto) {
    return this.planEntrenamientoService.createEjercicio(request.user.gimnasioId, createEjercicioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Post('grupos-musculares')
  createGrupoMuscular(@Req() request: AuthenticatedRequest, @Body() createGrupoMuscularDto: CreateGrupoMuscularDto) {
    return this.planEntrenamientoService.createGrupoMuscular(request.user.gimnasioId, createGrupoMuscularDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Patch('ejercicios/:id')
  updateEjercicio(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateEjercicioDto: UpdateEjercicioDto,
  ) {
    return this.planEntrenamientoService.updateEjercicio(request.user.gimnasioId, +id, updateEjercicioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Delete('ejercicios/:id')
  removeEjercicio(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.planEntrenamientoService.removeEjercicio(request.user.gimnasioId, +id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Post('ejercicios/:id/imagen')
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadEjercicioImagen(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST, fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.planEntrenamientoService.uploadEjercicioImagen(request.user.gimnasioId, +id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Patch('grupos-musculares/:id')
  updateGrupoMuscular(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateGrupoMuscularDto: UpdateGrupoMuscularDto,
  ) {
    return this.planEntrenamientoService.updateGrupoMuscular(request.user.gimnasioId, +id, updateGrupoMuscularDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CREACION_PLANES)
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.planEntrenamientoService.findAll(request.user.gimnasioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mio')
  async findMine(@Req() request: AuthenticatedRequest) {
    const assignment = await this.planEntrenamientoService.findAssignmentByUserId(request.user.sub);
    const plan = await this.planEntrenamientoService.findByUserId(request.user.sub);

    return {
      userId: request.user.sub,
      planEntrenamientoId: assignment?.planEntrenamientoId ?? null,
      plan,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.ASIGNACION_PLANES)
  @Get('usuario/:userId')
  async findByUserId(@Req() request: AuthenticatedRequest, @Param('userId') userId: string) {
    // assignPlanToUser/updatePlanForUser ya validan pertenencia al gimnasio;
    // reutilizamos esa validacion aca reasignando (no-op de datos) para
    // evitar duplicar la consulta de "usuario dentro del gimnasio".
    await this.planEntrenamientoService.findAssignmentByUserIdWithinGimnasio(request.user.gimnasioId, +userId);
    const plan = await this.planEntrenamientoService.findByUserId(+userId);
    return { plan };
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CATALOGO_EJERCICIOS)
  @Get('ejercicios/:id')
  findEjercicioById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.planEntrenamientoService.findEjercicioById(request.user.gimnasioId, +id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares/:id')
  findGrupoMuscularById(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.planEntrenamientoService.findGrupoMuscularById(request.user.gimnasioId, +id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares/:id/ejercicios')
  findEjerciciosByGrupoMuscularId(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.planEntrenamientoService.findEjerciciosByGrupoMuscularId(request.user.gimnasioId, +id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares-resumen')
  findGruposMuscularesResumen(@Req() request: AuthenticatedRequest) {
    return this.planEntrenamientoService.findGruposMuscularesResumen(request.user.gimnasioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares')
  findGruposMusculares(@Req() request: AuthenticatedRequest) {
    return this.planEntrenamientoService.findGruposMusculares(request.user.gimnasioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CREACION_PLANES)
  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.planEntrenamientoService.findOne(request.user.gimnasioId, +id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.ASIGNACION_PLANES)
  @Patch('usuario/:userId/asignar/:planId')
  assignPlanToUser(
    @Req() request: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.planEntrenamientoService.assignPlanToUser(request.user.gimnasioId, +userId, +planId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.ASIGNACION_PLANES)
  @Patch('usuario/:userId/editar')
  updatePlanForUser(
    @Req() request: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() createPlanEntrenamientoDto: CreatePlanEntrenamientoDto,
  ) {
    return this.planEntrenamientoService.updatePlanForUser(request.user.gimnasioId, +userId, createPlanEntrenamientoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CREACION_PLANES)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updatePlanEntrenamientoDto: UpdatePlanEntrenamientoDto,
  ) {
    return this.planEntrenamientoService.update(request.user.gimnasioId, +id, updatePlanEntrenamientoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.CREACION_PLANES)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.planEntrenamientoService.remove(request.user.gimnasioId, +id);
  }
}
