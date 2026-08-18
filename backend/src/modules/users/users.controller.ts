import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FeatureGuard } from '../auth/feature.guard';
import { RequireFeature } from '../auth/feature.decorator';
import { Funcionalidad } from '../gimnasio/funcionalidades';
import { UserRole } from './enums/user-role.enum';
import { AuthenticatedRequest } from '../auth/jwt-payload.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

 @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_USUARIOS)
  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.usersService.findAll(request.user.gimnasioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.ALTA_USUARIOS)
  @Get('pendientes')
  async findPending(@Req() request: AuthenticatedRequest) {
    console.log('[UsersController] GET /users/pendientes invocado');
    const users = await this.usersService.findCreatedUsers(request.user.gimnasioId);
    console.log(`[UsersController] GET /users/pendientes devolvio ${users.length} usuarios`);
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_USUARIOS)
  @Get('clientes-activos')
  async findActiveClients(@Req() request: AuthenticatedRequest) {
    console.log('[UsersController] GET /users/clientes-activos invocado');
    const users = await this.usersService.findActiveClients(request.user.gimnasioId);
    console.log(`[UsersController] GET /users/clientes-activos devolvio ${users.length} usuarios`);
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_USUARIOS)
  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.findOne(request.user.gimnasioId, +id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.ALTA_USUARIOS)
  @Patch(':id/estado')
  updateEstado(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.usersService.updateEstado(request.user.gimnasioId, +id, body.estado);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_USUARIOS)
  @Post(':id/membresia')
  updateMembership(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { membresiaId: number },
  ) {
    return this.usersService.updateMembershipByAdmin(request.user.gimnasioId, +id, body.membresiaId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_USUARIOS)
  @Delete(':id/membresia/:membresiaId')
  removeMembership(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('membresiaId') membresiaId: string,
  ) {
    return this.usersService.removeMembershipByAdmin(request.user.gimnasioId, +id, +membresiaId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_USUARIOS)
  @Post(':id/pago/al-dia')
  markPaymentAsUpToDate(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { membresiaId?: number },
  ) {
    return this.usersService.markPaymentAsUpToDateByAdmin(request.user.gimnasioId, +id, body?.membresiaId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.ALTA_USUARIOS)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.remove(request.user.gimnasioId, +id);
  }
}
