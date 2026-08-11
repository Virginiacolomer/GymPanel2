import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CreateMembresiaDto } from './dto/create-membresia.dto';
import { UpdateMembresiaDto } from './dto/update-membresia.dto';
import { Membresia } from './entities/membresia.entity';
import { Pago } from './entities/pago.entity';
import { EstadoUserMembresia } from './entities/estadoUserMembresia.entity';
import { UserMembresia } from './entities/userMembresia.entity';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class MembresiaService {
  private readonly logger = new Logger(MembresiaService.name);

  constructor(
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(EstadoUserMembresia)
    private readonly estadoUserMembresiaRepository: Repository<EstadoUserMembresia>,
    @InjectRepository(UserMembresia)
    private readonly userMembresiaRepository: Repository<UserMembresia>,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly configService: ConfigService,
  ) {}

  async create(gimnasioId: number, createMembresiaDto: CreateMembresiaDto) {
    const membresia = this.membresiaRepository.create({
      gimnasioId,
      nombre: createMembresiaDto.nombre.trim(),
      descripcion: createMembresiaDto.descripcion?.trim() || null,
      dias: createMembresiaDto.dias,
      costo: createMembresiaDto.costo,
    });

    return this.membresiaRepository.save(membresia);
  }

  // gimnasioId es opcional porque este endpoint tambien lo usa la pagina
  // publica de membresias (sin sesion iniciada, sin gimnasio conocido
  // todavia); sin el, devolvemos una lista vacia en vez de mezclar datos de
  // todos los gimnasios.
  async findAll(gimnasioId?: number) {
    if (!gimnasioId) {
      return [];
    }

    return this.membresiaRepository.find({
      where: { gimnasioId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    return this.findMembresiaById(id);
  }

  async findMembresiaById(id: number) {
    const membresia = await this.membresiaRepository.findOne({ where: { id } });

    if (!membresia) {
      throw new NotFoundException(`No se encontro la membresia con id ${id}`);
    }

    return membresia;
  }

  // Trae una membresia verificando que pertenezca al gimnasio indicado;
  // usarlo para cualquier operacion de escritura (crear pago manual, editar,
  // borrar) iniciada por un admin.
  private async getMembresiaWithinGimnasio(gimnasioId: number, id: number): Promise<Membresia> {
    const membresia = await this.membresiaRepository.findOne({
      where: { id, gimnasioId },
    });

    if (!membresia) {
      throw new NotFoundException(`No se encontro la membresia con id ${id}`);
    }

    return membresia;
  }

  async findPagoById(gimnasioId: number, id: number) {
    const pago = await this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoinAndSelect('pago.user', 'user')
      .leftJoinAndSelect('pago.membresia', 'membresia')
      .leftJoinAndSelect('pago.userMembresia', 'userMembresia')
      .leftJoinAndSelect('userMembresia.membresia', 'userMembresiaMembresia')
      .leftJoinAndSelect('userMembresia.estado', 'userMembresiaEstado')
      .leftJoinAndSelect('userMembresia.user', 'userMembresiaUser')
      .where('pago.id = :id', { id })
      .andWhere(
        '(user.gimnasioId = :gimnasioId OR userMembresiaUser.gimnasioId = :gimnasioId)',
        { gimnasioId },
      )
      .getOne();

    if (!pago) {
      throw new NotFoundException(`No se encontro el pago con id ${id}`);
    }

    return pago;
  }

  async findEstadoUserMembresiaById(id: number) {
    const estado = await this.estadoUserMembresiaRepository.findOne({ where: { id } });

    if (!estado) {
      throw new NotFoundException(`No se encontro el estado de membresia con id ${id}`);
    }

    return estado;
  }

  async update(gimnasioId: number, id: number, updateMembresiaDto: UpdateMembresiaDto) {
    const membresia = await this.getMembresiaWithinGimnasio(gimnasioId, id);

    if (typeof updateMembresiaDto.nombre === 'string') {
      membresia.nombre = updateMembresiaDto.nombre.trim();
    }

    if (typeof updateMembresiaDto.descripcion === 'string') {
      membresia.descripcion = updateMembresiaDto.descripcion.trim() || null;
    }

    if (typeof updateMembresiaDto.dias === 'number') {
      membresia.dias = updateMembresiaDto.dias;
    }

    if (typeof updateMembresiaDto.costo === 'number') {
      membresia.costo = updateMembresiaDto.costo;
    }

    await this.membresiaRepository.save(membresia);

    return this.membresiaRepository.findOne({ where: { id } });
  }

  async remove(gimnasioId: number, id: number) {
    const membresia = await this.getMembresiaWithinGimnasio(gimnasioId, id);

    const assignedUsersCount = await this.userMembresiaRepository.count({
      where: { membresiaId: id },
    });

    if (assignedUsersCount > 0) {
      throw new ConflictException('No se puede eliminar la membresia porque esta asignada a usuarios.');
    }

    const pagosCount = await this.pagoRepository
      .createQueryBuilder('pago')
      .innerJoin('pago.userMembresia', 'userMembresia')
      .where('userMembresia.membresiaId = :membresiaId', { membresiaId: id })
      .getCount();

    if (pagosCount > 0) {
      throw new ConflictException('No se puede eliminar la membresia porque tiene pagos registrados.');
    }

    await this.membresiaRepository.remove(membresia);

    return { message: 'Membresia eliminada correctamente.', id };
  }

  private async hasCurrentMonthPayment(userMembresiaId: number): Promise<boolean> {
    const paymentCount = await this.pagoRepository
      .createQueryBuilder('pago')
      .where('pago.user_membresia_id = :userMembresiaId', { userMembresiaId })
      .andWhere(
        "DATE_TRUNC('month', pago.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')",
      )
      .getCount();

    return paymentCount > 0;
  }

  private async syncMembershipStatusByPayment(userMembresia: UserMembresia): Promise<boolean> {
    const isPaymentUpToDate = await this.hasCurrentMonthPayment(userMembresia.id);

    const expectedStateName = isPaymentUpToDate ? 'AL_DIA' : 'PENDIENTE_PAGO';
    const expectedState = await this.estadoUserMembresiaRepository.findOne({
      where: { nombre: expectedStateName },
    });

    if (!expectedState) {
      throw new NotFoundException(`Estado ${expectedStateName} no encontrado`);
    }

    if (userMembresia.estadoId !== expectedState.id) {
      userMembresia.estadoId = expectedState.id;
      await this.userMembresiaRepository.save(userMembresia);
    }

    return isPaymentUpToDate;
  }

  // Los metodos "mi-*" de abajo reciben el userId desde request.user.sub (el
  // propio JWT del usuario), asi que ya estan scopeados de forma implicita:
  // un usuario solo puede pedir informacion de si mismo, nunca de otro id.

  async findCurrentUserPaymentStatus(userId: number) {
    const memberships = await this.userMembresiaRepository.find({
      where: { userId },
      relations: ['membresia', 'estado'],
      order: { createdAt: 'DESC' },
    });

    if (memberships.length === 0) {
      return { hasEntrenamientoMembership: false, isPaymentUpToDate: null };
    }

    for (const membership of memberships) {
      await this.syncMembershipStatusByPayment(membership);
    }

    const updatedMemberships = await this.userMembresiaRepository.find({
      where: { userId },
      relations: ['membresia', 'estado'],
      order: { createdAt: 'DESC' },
    });

    const isPaymentUpToDate =
      updatedMemberships.length > 0 &&
      updatedMemberships.every((membership) => membership.estado?.nombre === 'AL_DIA');

    const latestMembership = updatedMemberships[0];

    return {
      hasEntrenamientoMembership: true,
      isPaymentUpToDate,
      membresiaName: latestMembership?.membresia?.nombre,
      membresiaId: latestMembership?.membresiaId,
    };
  }

  async findCurrentMonthPaymentsForUser(userId: number) {
    const rawPayments = await this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoin('pago.userMembresia', 'userMembresia')
      .leftJoin('userMembresia.membresia', 'membresiaActual')
      .leftJoin('pago.membresia', 'membresiaLegacy')
      .select('pago.id', 'id')
      .addSelect('COALESCE(pago.user_id, userMembresia.user_id)', 'userId')
      .addSelect('pago.user_membresia_id', 'userMembresiaId')
      .addSelect('pago.created_at', 'createdAt')
      .addSelect('COALESCE(membresiaActual.id, membresiaLegacy.id)', 'membresiaId')
      .addSelect("COALESCE(membresiaActual.nombre, membresiaLegacy.nombre, 'Sin membresia')", 'membresiaNombre')
      .addSelect('COALESCE(membresiaActual.costo, membresiaLegacy.costo)', 'costo')
      .where('(pago.user_id = :userId OR userMembresia.user_id = :userId)', { userId })
      .andWhere(
        "DATE_TRUNC('month', pago.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')",
      )
      .orderBy('pago.created_at', 'DESC')
      .getRawMany<{
        id: string;
        userId: string | null;
        userMembresiaId: string | null;
        createdAt: string;
        membresiaId: string | null;
        membresiaNombre: string | null;
        costo: string | null;
      }>();

    return rawPayments.map((payment) => {
      const createdAt = new Date(payment.createdAt);

      return {
        id: Number(payment.id),
        userId: payment.userId === null ? null : Number(payment.userId),
        userMembresiaId: payment.userMembresiaId === null ? null : Number(payment.userMembresiaId),
        createdAt,
        mes: createdAt.getMonth() + 1,
        membresiaId: payment.membresiaId === null ? null : Number(payment.membresiaId),
        membresiaNombre: payment.membresiaNombre ?? 'Sin membresia',
        costo: payment.costo === null ? null : Number(payment.costo),
      };
    });
  }

  async findPaymentsByDateRange(gimnasioId: number, desde: string, hasta: string) {
    const rawPayments = await this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoin('pago.userMembresia', 'userMembresia')
      .leftJoin('userMembresia.user', 'userMembresiaUser')
      .leftJoin('pago.user', 'pagoUser')
      .leftJoin('pago.membresia', 'membresiaPago')
      .leftJoin('userMembresia.membresia', 'membresiaFallback')
      .select('pago.id', 'id')
      .addSelect('COALESCE(pago.user_id, userMembresia.user_id)', 'userId')
      .addSelect('pago.created_at', 'createdAt')
      .addSelect('COALESCE(membresiaPago.id, membresiaFallback.id)', 'membresiaId')
      .addSelect("COALESCE(membresiaPago.nombre, membresiaFallback.nombre, 'Sin membresia')", 'membresiaNombre')
      // Prioriza la membresia registrada en el pago y solo usa fallback si ese dato no existe.
      .addSelect('COALESCE(membresiaPago.costo, membresiaFallback.costo)', 'costo')
      .where('(pagoUser.gimnasioId = :gimnasioId OR userMembresiaUser.gimnasioId = :gimnasioId)', { gimnasioId })
      .andWhere(
        "(pago.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= :desde",
        { desde },
      )
      .andWhere(
        "(pago.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date <= :hasta",
        { hasta },
      )
      .orderBy('pago.created_at', 'DESC')
      .getRawMany<{
        id: string;
        userId: string | null;
        createdAt: string;
        membresiaId: string | null;
        membresiaNombre: string | null;
        costo: string | null;
      }>();

    return rawPayments.map((payment) => ({
      id: Number(payment.id),
      userId: payment.userId === null ? null : Number(payment.userId),
      createdAt: new Date(payment.createdAt),
      membresiaId: payment.membresiaId === null ? null : Number(payment.membresiaId),
      membresiaNombre: payment.membresiaNombre ?? 'Sin membresia',
      costo: payment.costo === null ? null : Number(payment.costo),
    }));
  }

  async getCurrentMonthReportMetrics(gimnasioId: number) {
    const pendingCountRaw = await this.userMembresiaRepository
      .createQueryBuilder('userMembresia')
      .leftJoin('userMembresia.estado', 'estado')
      .leftJoin('userMembresia.user', 'user')
      .select('COUNT(DISTINCT userMembresia.user_id)', 'count')
      .where("estado.nombre = 'PENDIENTE_PAGO'")
      .andWhere('user.gimnasioId = :gimnasioId', { gimnasioId })
      .getRawOne<{ count: string }>();

    const membershipsByMonthRaw = await this.userMembresiaRepository
      .createQueryBuilder('userMembresia')
      .leftJoin('userMembresia.membresia', 'membresia')
      .leftJoin('userMembresia.user', 'user')
      .select('membresia.id', 'membresiaId')
      .addSelect('membresia.nombre', 'membresiaNombre')
      .addSelect('COUNT(*)', 'cantidad')
      .where('user.gimnasioId = :gimnasioId', { gimnasioId })
      .andWhere(
        "DATE_TRUNC('month', userMembresia.created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') = DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')",
      )
      .groupBy('membresia.id')
      .addGroupBy('membresia.nombre')
      .orderBy('membresia.nombre', 'ASC')
      .getRawMany<{
        membresiaId: string;
        membresiaNombre: string;
        cantidad: string;
      }>();

    return {
      pendingPaymentUsersCurrentMonth: Number(pendingCountRaw?.count ?? 0),
      membershipsChosenCurrentMonth: membershipsByMonthRaw.map((row) => ({
        membresiaId: Number(row.membresiaId),
        membresiaNombre: row.membresiaNombre,
        cantidad: Number(row.cantidad),
      })),
    };
  }

  async findAllPaymentsForUser(userId: number) {
    const rawPayments = await this.pagoRepository
      .createQueryBuilder('pago')
      .leftJoin('pago.userMembresia', 'userMembresia')
      .leftJoin('userMembresia.membresia', 'membresiaActual')
      .leftJoin('pago.membresia', 'membresiaLegacy')
      .select('pago.id', 'id')
      .addSelect('COALESCE(pago.user_id, userMembresia.user_id)', 'userId')
      .addSelect('pago.user_membresia_id', 'userMembresiaId')
      .addSelect('pago.created_at', 'createdAt')
      .addSelect('COALESCE(membresiaActual.id, membresiaLegacy.id)', 'membresiaId')
      .addSelect("COALESCE(membresiaActual.nombre, membresiaLegacy.nombre, 'Sin membresia')", 'membresiaNombre')
      .addSelect('COALESCE(membresiaActual.costo, membresiaLegacy.costo)', 'costo')
      .where('(pago.user_id = :userId OR userMembresia.user_id = :userId)', { userId })
      .orderBy('pago.created_at', 'DESC')
      .getRawMany<{
        id: string;
        userId: string | null;
        userMembresiaId: string | null;
        createdAt: string;
        membresiaId: string | null;
        membresiaNombre: string | null;
        costo: string | null;
      }>();

    return rawPayments.map((payment) => {
      const createdAt = new Date(payment.createdAt);

      return {
        id: Number(payment.id),
        userId: payment.userId === null ? null : Number(payment.userId),
        userMembresiaId: payment.userMembresiaId === null ? null : Number(payment.userMembresiaId),
        createdAt,
        mes: createdAt.getMonth() + 1,
        membresiaId: payment.membresiaId === null ? null : Number(payment.membresiaId),
        membresiaNombre: payment.membresiaNombre ?? 'Sin membresia',
        costo: payment.costo === null ? null : Number(payment.costo),
      };
    });
  }

  async findUserCurrentMembership(userId: number) {
    const userMembresship = await this.userMembresiaRepository
      .createQueryBuilder('userMembresia')
      .leftJoinAndSelect('userMembresia.membresia', 'membresia')
      .leftJoinAndSelect('userMembresia.estado', 'estado')
      .where('userMembresia.userId = :userId', { userId })
      .orderBy('userMembresia.createdAt', 'DESC')
      .getOne();

    if (!userMembresship) {
      return null;
    }

    await this.syncMembershipStatusByPayment(userMembresship);

    return this.userMembresiaRepository.findOne({
      where: {
        userId: userMembresship.userId,
        membresiaId: userMembresship.membresiaId,
      },
      relations: ['membresia', 'estado'],
    });
  }

  async findUserCurrentMemberships(userId: number) {
    const memberships = await this.userMembresiaRepository.find({
      where: { userId },
      relations: ['membresia', 'estado'],
      order: { createdAt: 'DESC' },
    });

    if (memberships.length === 0) {
      return [];
    }

    for (const membership of memberships) {
      await this.syncMembershipStatusByPayment(membership);
    }

    return this.userMembresiaRepository.find({
      where: { userId },
      relations: ['membresia', 'estado'],
      order: { createdAt: 'DESC' },
    });
  }

  // Un usuario tiene una unica membresia activa a la vez: si ya tenia una,
  // se reapunta a la nueva en vez de agregar una fila extra.
  async assignMembershipToUser(gimnasioId: number, userId: number, membresiaId: number) {
    // Evita que un cliente se auto-asigne una membresia de otro gimnasio.
    const membresia = await this.membresiaRepository.findOne({
      where: { id: membresiaId, gimnasioId },
    });

    if (!membresia) {
      throw new NotFoundException(`No se encontro la membresia con id ${membresiaId}`);
    }

    const estadoPendiente = await this.estadoUserMembresiaRepository.findOne({
      where: { nombre: 'PENDIENTE_PAGO' },
    });

    if (!estadoPendiente) {
      throw new NotFoundException('Estado PENDIENTE_PAGO no encontrado');
    }

    const existingMembership = await this.userMembresiaRepository.findOne({
      where: { userId },
      order: { id: 'DESC' },
    });

    if (existingMembership) {
      existingMembership.membresiaId = membresiaId;
      existingMembership.membresia = membresia;
      existingMembership.estadoId = estadoPendiente.id;

      const saved = await this.userMembresiaRepository.save(existingMembership);
      await this.userMembresiaRepository.update(saved.id, { createdAt: new Date() });

      return this.userMembresiaRepository.findOne({
        where: { id: saved.id },
        relations: ['membresia', 'estado'],
      });
    }

    const userMembresia = this.userMembresiaRepository.create({
      userId,
      membresiaId,
      estadoId: estadoPendiente.id,
    });

    return this.userMembresiaRepository.save(userMembresia);
  }

  // Codifica los datos que el webhook necesita para saber que membresia
  // marcar como pagada, sin depender de una tabla de preferencias propia.
  private buildExternalReference(gimnasioId: number, userId: number, userMembresiaId: number, membresiaId: number): string {
    return `gp:${gimnasioId}:${userId}:${userMembresiaId}:${membresiaId}`;
  }

  private parseExternalReference(externalReference: string): {
    gimnasioId: number;
    userId: number;
    userMembresiaId: number;
    membresiaId: number;
  } | null {
    const parts = externalReference.split(':');
    if (parts.length !== 5 || parts[0] !== 'gp') {
      return null;
    }

    const [, gimnasioId, userId, userMembresiaId, membresiaId] = parts.map((part, index) => (index === 0 ? part : Number(part)));

    if ([gimnasioId, userId, userMembresiaId, membresiaId].some((value) => !Number.isInteger(value))) {
      return null;
    }

    return {
      gimnasioId: gimnasioId as number,
      userId: userId as number,
      userMembresiaId: userMembresiaId as number,
      membresiaId: membresiaId as number,
    };
  }

  async crearCheckoutMercadoPago(gimnasioId: number, userId: number) {
    const userMembresia = await this.userMembresiaRepository.findOne({
      where: { userId },
      relations: ['membresia'],
      order: { id: 'DESC' },
    });

    if (!userMembresia || !userMembresia.membresia) {
      throw new NotFoundException('No tenes una membresia asignada. Elegi una membresia antes de pagar.');
    }

    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') || '').replace(/\/+$/, '');
    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL no esta configurada en el servidor.');
    }

    const backendUrl = (this.configService.get<string>('BACKEND_URL') || '').replace(/\/+$/, '');
    const externalReference = this.buildExternalReference(
      gimnasioId,
      userId,
      userMembresia.id,
      userMembresia.membresiaId,
    );

    const preference = await this.mercadoPagoService.createPreference({
      title: `Membresia ${userMembresia.membresia.nombre}`,
      unitPrice: userMembresia.membresia.costo,
      externalReference,
      successUrl: `${frontendUrl}/mis-pagos?pago=exito`,
      failureUrl: `${frontendUrl}/mis-pagos?pago=fallo`,
      pendingUrl: `${frontendUrl}/mis-pagos?pago=pendiente`,
      notificationUrl: backendUrl ? `${backendUrl}/membresia/webhook/mercadopago` : undefined,
    });

    if (!backendUrl) {
      this.logger.warn(
        'BACKEND_URL no configurada: la preferencia se creo sin notification_url. Configura la URL de notificaciones en el panel de Mercado Pago para que los pagos se confirmen automaticamente.',
      );
    }

    return {
      initPoint: preference.sandbox_init_point || preference.init_point,
    };
  }

  // Idempotente: si ya procesamos este pago (mismo mpPaymentId), no vuelve a
  // crear un Pago ni reescribe el estado.
  async procesarWebhookMercadoPago(paymentId: string) {
    const yaProcesado = await this.pagoRepository.findOne({ where: { mpPaymentId: paymentId } });
    if (yaProcesado) {
      return { message: 'Pago ya procesado previamente.', pagoId: yaProcesado.id };
    }

    const payment = await this.mercadoPagoService.getPayment(paymentId);

    if (payment.status !== 'approved') {
      return { message: `Pago con estado '${payment.status}', no se registra todavia.` };
    }

    const referencia = payment.external_reference ? this.parseExternalReference(payment.external_reference) : null;
    if (!referencia) {
      this.logger.warn(`Webhook de Mercado Pago con external_reference invalida: ${payment.external_reference}`);
      return { message: 'external_reference invalida o ausente.' };
    }

    const userMembresia = await this.userMembresiaRepository.findOne({
      where: { id: referencia.userMembresiaId, userId: referencia.userId },
    });

    if (!userMembresia) {
      this.logger.warn(`Webhook de Mercado Pago: no se encontro userMembresia ${referencia.userMembresiaId} para el usuario ${referencia.userId}`);
      return { message: 'No se encontro la membresia del usuario referenciada.' };
    }

    const estadoAlDia = await this.estadoUserMembresiaRepository.findOne({ where: { nombre: 'AL_DIA' } });
    if (!estadoAlDia) {
      throw new NotFoundException('Estado AL_DIA no encontrado');
    }

    userMembresia.estadoId = estadoAlDia.id;
    await this.userMembresiaRepository.save(userMembresia);

    const pago = this.pagoRepository.create({
      userId: referencia.userId,
      userMembresiaId: userMembresia.id,
      membresiaId: userMembresia.membresiaId,
      metodoPago: 'mercado_pago',
      mpPaymentId: String(payment.id),
    });
    const savedPago = await this.pagoRepository.save(pago);

    return {
      message: 'Pago de Mercado Pago registrado correctamente.',
      pagoId: savedPago.id,
    };
  }
}
