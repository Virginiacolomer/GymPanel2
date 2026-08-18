import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { HorarioService } from './horario.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FeatureGuard } from '../auth/feature.guard';
import { RequireFeature } from '../auth/feature.decorator';
import { Funcionalidad } from '../gimnasio/funcionalidades';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../auth/jwt-payload.interface';

@Controller('horarios')
export class HorarioController {
  constructor(private readonly horarioService: HorarioService) {}

  // El gimnasio se identifica por el gimnasioId del propio JWT, nunca por un
  // :id de ruta: asi un admin/cliente solo ve o edita los horarios de su gimnasio.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get()
  findMine(@Req() request: AuthenticatedRequest) {
    return this.horarioService.findAllByGimnasio(request.user.gimnasioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.DATOS_Y_HORARIOS)
  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createHorarioDto: CreateHorarioDto) {
    return this.horarioService.create(request.user.gimnasioId, createHorarioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.DATOS_Y_HORARIOS)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHorarioDto: UpdateHorarioDto,
  ) {
    return this.horarioService.update(request.user.gimnasioId, id, updateHorarioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.DATOS_Y_HORARIOS)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.horarioService.remove(request.user.gimnasioId, id);
  }
}
