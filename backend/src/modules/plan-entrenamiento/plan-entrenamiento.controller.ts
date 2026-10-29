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
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../auth/jwt-payload.interface';

@Controller('plan-entrenamiento')
export class PlanEntrenamientoController {
  constructor(
    private readonly planEntrenamientoService: PlanEntrenamientoService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createPlanEntrenamientoDto: CreatePlanEntrenamientoDto) {
    return this.planEntrenamientoService.create(createPlanEntrenamientoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('ejercicios')
  createEjercicio(@Body() createEjercicioDto: CreateEjercicioDto) {
    return this.planEntrenamientoService.createEjercicio(createEjercicioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('grupos-musculares')
  createGrupoMuscular(@Body() createGrupoMuscularDto: CreateGrupoMuscularDto) {
    return this.planEntrenamientoService.createGrupoMuscular(
      createGrupoMuscularDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('ejercicios/:id')
  updateEjercicio(
    @Param('id') id: string,
    @Body() updateEjercicioDto: UpdateEjercicioDto,
  ) {
    return this.planEntrenamientoService.updateEjercicio(
      +id,
      updateEjercicioDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('ejercicios/:id')
  removeEjercicio(@Param('id') id: string) {
    return this.planEntrenamientoService.removeEjercicio(+id);
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
    return this.planEntrenamientoService.uploadEjercicioImagen(+id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('grupos-musculares/:id')
  updateGrupoMuscular(
    @Param('id') id: string,
    @Body() updateGrupoMuscularDto: UpdateGrupoMuscularDto,
  ) {
    return this.planEntrenamientoService.updateGrupoMuscular(
      +id,
      updateGrupoMuscularDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.planEntrenamientoService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mio')
  async findMine(@Req() request: AuthenticatedRequest) {
    const assignment =
      await this.planEntrenamientoService.findAssignmentByUserId(
        request.user.sub,
      );
    const plan = await this.planEntrenamientoService.findByUserId(
      request.user.sub,
    );

    return {
      userId: request.user.sub,
      planEntrenamientoId: assignment?.planEntrenamientoId ?? null,
      plan,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('usuario/:userId')
  async findByUserId(@Param('userId') userId: string) {
    // Valida que el usuario exista (404 si no) antes de exponer su plan.
    await this.planEntrenamientoService.findAssignmentByExistingUserId(+userId);
    const plan = await this.planEntrenamientoService.findByUserId(+userId);
    return { plan };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('ejercicios/:id')
  findEjercicioById(@Param('id') id: string) {
    return this.planEntrenamientoService.findEjercicioById(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares/:id')
  findGrupoMuscularById(@Param('id') id: string) {
    return this.planEntrenamientoService.findGrupoMuscularById(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares/:id/ejercicios')
  findEjerciciosByGrupoMuscularId(@Param('id') id: string) {
    return this.planEntrenamientoService.findEjerciciosByGrupoMuscularId(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares-resumen')
  findGruposMuscularesResumen() {
    return this.planEntrenamientoService.findGruposMuscularesResumen();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('grupos-musculares')
  findGruposMusculares() {
    return this.planEntrenamientoService.findGruposMusculares();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planEntrenamientoService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('usuario/:userId/asignar/:planId')
  assignPlanToUser(
    @Param('userId') userId: string,
    @Param('planId') planId: string,
  ) {
    return this.planEntrenamientoService.assignPlanToUser(+userId, +planId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('usuario/:userId/editar')
  updatePlanForUser(
    @Param('userId') userId: string,
    @Body() createPlanEntrenamientoDto: CreatePlanEntrenamientoDto,
  ) {
    return this.planEntrenamientoService.updatePlanForUser(
      +userId,
      createPlanEntrenamientoDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlanEntrenamientoDto: UpdatePlanEntrenamientoDto,
  ) {
    return this.planEntrenamientoService.update(
      +id,
      updatePlanEntrenamientoDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planEntrenamientoService.remove(+id);
  }
}
