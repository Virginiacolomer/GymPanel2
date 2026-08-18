import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe } from '@nestjs/common';
import { MembresiaService } from './membresia.service';
import { CreateMembresiaDto } from './dto/create-membresia.dto';
import { UpdateMembresiaDto } from './dto/update-membresia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FeatureGuard } from '../auth/feature.guard';
import { RequireFeature } from '../auth/feature.decorator';
import { Funcionalidad } from '../gimnasio/funcionalidades';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../auth/jwt-payload.interface';

@Controller('membresia')
export class MembresiaController {
  constructor(private readonly membresiaService: MembresiaService) {}

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_MEMBRESIAS)
  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() createMembresiaDto: CreateMembresiaDto) {
    return this.membresiaService.create(request.user.gimnasioId, createMembresiaDto);
  }

  // Publico (sin guard): usado tanto por la pagina de marketing como, con
  // ?gimnasioId=, por el panel de administracion ya logueado.
  @Get()
  findAll(@Query('gimnasioId') gimnasioId?: string) {
    return this.membresiaService.findAll(gimnasioId ? +gimnasioId : undefined);
  }

  // Publico (sin guard): lo llama Mercado Pago, no un usuario logueado. La
  // seguridad no depende del payload recibido: siempre volvemos a consultar
  // el pago a la API de Mercado Pago con nuestro propio access token antes
  // de registrar nada.
  @Post('webhook/mercadopago')
  async webhookMercadoPago(@Body() body: any, @Query() query: any) {
    const paymentId = body?.data?.id ?? query?.['data.id'] ?? query?.id;
    const type = body?.type ?? body?.action ?? query?.type ?? query?.topic;

    if (type && type !== 'payment') {
      return { message: `Notificacion de tipo '${type}' ignorada.` };
    }

    if (!paymentId) {
      return { message: 'Notificacion sin id de pago, se ignora.' };
    }

    return this.membresiaService.procesarWebhookMercadoPago(String(paymentId));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mi-estado')
  async findMyPaymentStatus(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.findCurrentUserPaymentStatus(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mi-membresia')
  async getMyMembership(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.findUserCurrentMembership(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mis-membresias')
  async getMyMemberships(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.findUserCurrentMemberships(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mis-pagos/mes-actual')
  async getMyCurrentMonthPayments(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.findCurrentMonthPaymentsForUser(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Get('mis-pagos')
  async getMyPayments(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.findAllPaymentsForUser(request.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @Post('asignar')
  async assignMembership(@Req() request: AuthenticatedRequest, @Body() body: { membresiaId: number }) {
    return this.membresiaService.assignMembershipToUser(request.user.gimnasioId, request.user.sub, body.membresiaId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.CLIENTE)
  @RequireFeature(Funcionalidad.PAGO_MERCADOPAGO)
  @Post('checkout')
  async crearCheckout(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.crearCheckoutMercadoPago(request.user.gimnasioId, request.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.REPORTE_INGRESOS)
  @Get('pagos/rango')
  findPaymentsByDateRange(
    @Req() request: AuthenticatedRequest,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.membresiaService.findPaymentsByDateRange(request.user.gimnasioId, desde, hasta);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.REPORTE_INGRESOS)
  @Get('reporte/metricas-mes-actual')
  getCurrentMonthReportMetrics(@Req() request: AuthenticatedRequest) {
    return this.membresiaService.getCurrentMonthReportMetrics(request.user.gimnasioId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membresiaService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('pagos/:id')
  findPagoById(@Req() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.membresiaService.findPagoById(request.user.gimnasioId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('estados/:id')
  findEstadoUserMembresiaById(@Param('id') id: string) {
    return this.membresiaService.findEstadoUserMembresiaById(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_MEMBRESIAS)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateMembresiaDto: UpdateMembresiaDto,
  ) {
    return this.membresiaService.update(request.user.gimnasioId, +id, updateMembresiaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
  @Roles(UserRole.ADMIN)
  @RequireFeature(Funcionalidad.GESTION_MEMBRESIAS)
  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.membresiaService.remove(request.user.gimnasioId, +id);
  }
}
