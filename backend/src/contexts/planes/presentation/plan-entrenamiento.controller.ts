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
import { CreatePlanEntrenamientoDto } from './create-plan-entrenamiento.dto';
import { UpdatePlanEntrenamientoDto } from './update-plan-entrenamiento.dto';
import { aRespuestaDePlan } from './plan-respuesta';
import { UserRole } from '../../usuarios';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../auth';
import { CrearPlan } from '../application/crear-plan';
import { ListarPlanesPredeterminados } from '../application/listar-planes-predeterminados';
import { ConsultarPlan } from '../application/consultar-plan';
import { EditarPlan } from '../application/editar-plan';
import { EliminarPlan } from '../application/eliminar-plan';
import { AsignarPlan } from '../application/asignar-plan';
import { EditarPlanDeUsuario } from '../application/editar-plan-de-usuario';
import { ConsultarPlanDeUsuario } from '../application/consultar-plan-de-usuario';
import { conReintentoDeConexion } from '../infrastructure/reintento-conexion-db';

// Orden de rutas: las fijas (mio, usuario/:userId) van antes que :id, porque
// Nest las evalua en el orden en que se declaran.
@Controller('plan-entrenamiento')
export class PlanEntrenamientoController {
  constructor(
    private readonly crearPlan: CrearPlan,
    private readonly listarPlanesPredeterminados: ListarPlanesPredeterminados,
    private readonly consultarPlan: ConsultarPlan,
    private readonly editarPlan: EditarPlan,
    private readonly eliminarPlan: EliminarPlan,
    private readonly asignarPlan: AsignarPlan,
    private readonly editarPlanDeUsuario: EditarPlanDeUsuario,
    private readonly consultarPlanDeUsuario: ConsultarPlanDeUsuario,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createPlanEntrenamientoDto: CreatePlanEntrenamientoDto) {
    return this.crearPlan.ejecutar(createPlanEntrenamientoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    const planes = await this.listarPlanesPredeterminados.ejecutar();
    return planes.map((plan) => aRespuestaDePlan(plan));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mio')
  async findMine(@Req() request: AuthenticatedRequest) {
    const { planId, plan } = await this.consultarPlanDeUsuario.delCliente(
      request.user.sub,
    );

    return {
      userId: request.user.sub,
      planEntrenamientoId: planId === null ? null : String(planId),
      plan: plan ? aRespuestaDePlan(plan) : null,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('usuario/:userId')
  async findByUserId(@Param('userId') userId: string) {
    const { plan } = await this.consultarPlanDeUsuario.deUsuario(+userId);
    return { plan: plan ? aRespuestaDePlan(plan) : null };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return aRespuestaDePlan(await this.consultarPlan.ejecutar(+id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('usuario/:userId/asignar/:planId')
  assignPlanToUser(
    @Param('userId') userId: string,
    @Param('planId') planId: string,
  ) {
    return conReintentoDeConexion('assignPlanToUser', () =>
      this.asignarPlan.ejecutar(+userId, +planId),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('usuario/:userId/editar')
  updatePlanForUser(
    @Param('userId') userId: string,
    @Body() createPlanEntrenamientoDto: CreatePlanEntrenamientoDto,
  ) {
    return this.editarPlanDeUsuario.ejecutar(
      +userId,
      createPlanEntrenamientoDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePlanEntrenamientoDto: UpdatePlanEntrenamientoDto,
  ) {
    const plan = await this.editarPlan.ejecutar(
      +id,
      updatePlanEntrenamientoDto,
    );
    return aRespuestaDePlan(plan);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eliminarPlan.ejecutar(+id);
  }
}
