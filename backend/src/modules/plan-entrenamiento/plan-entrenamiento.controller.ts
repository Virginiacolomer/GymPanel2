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
} from '@nestjs/common';
import { PlanEntrenamientoService } from './plan-entrenamiento.service';
import { CreatePlanEntrenamientoDto } from './dto/create-plan-entrenamiento.dto';
import { UpdatePlanEntrenamientoDto } from './dto/update-plan-entrenamiento.dto';
import { UserRole } from '../users/enums/user-role.enum';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../contexts/auth';

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
