import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlanEntrenamientoDto } from './dto/create-plan-entrenamiento.dto';
import { UpdatePlanEntrenamientoDto } from './dto/update-plan-entrenamiento.dto';
import { PlanEntrenamiento } from './entities/plan-entrenamiento.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PlanEntrenamientoService {
  private static readonly DIAS_SEMANA = 7;
  private readonly logger = new Logger(PlanEntrenamientoService.name);

  private isTransientDbConnectionError(error: unknown): boolean {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : '';
    return (
      message.includes('Connection terminated unexpectedly') ||
      message.includes('ECONNRESET') ||
      message.includes('ETIMEDOUT') ||
      message.includes('57P01')
    );
  }

  private async executeWithDbRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!this.isTransientDbConnectionError(error)) {
        throw error;
      }

      this.logger.warn(
        `[${operationName}] Error transitorio de conexion con DB. Reintentando una vez. Detalle: ${error instanceof Error ? error.message : String(error)}`,
      );

      return operation();
    }
  }

  constructor(
    @InjectRepository(PlanEntrenamiento)
    private readonly planEntrenamientoRepository: Repository<PlanEntrenamiento>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async deletePlanIfUnused(planId: number | null): Promise<void> {
    if (!planId) {
      return;
    }

    const plan = await this.planEntrenamientoRepository.findOne({
      where: { id: planId },
      select: { id: true, tipo: true },
    });

    if (!plan) {
      return;
    }

    // Los planes predeterminados no se eliminan nunca.
    if (plan.tipo !== 'editado') {
      return;
    }

    const usersUsingPlan = await this.userRepository.count({
      where: { planEntrenamientoId: planId },
    });

    if (usersUsingPlan > 0) {
      return;
    }

    await this.planEntrenamientoRepository.delete(planId);
  }

  // Trae el usuario objetivo (asignar/editar plan por userId) o tira 404.
  private async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`No se encontro el usuario con id ${userId}`);
    }

    return user;
  }

  private normalizeEjercicios(
    cantidadDias: number,
    ejercicios: Array<number[] | null>,
  ) {
    if (
      !Array.isArray(ejercicios) ||
      ejercicios.length !== PlanEntrenamientoService.DIAS_SEMANA
    ) {
      throw new BadRequestException(
        'La columna ejercicios debe contener exactamente 7 posiciones.',
      );
    }

    return ejercicios.map((dia, index) => {
      const diaIndex = index + 1;

      if (diaIndex > cantidadDias) {
        if (dia !== null) {
          throw new BadRequestException(
            `El dia ${diaIndex} debe enviarse como null porque excede la cantidad de dias configurada.`,
          );
        }

        return null;
      }

      if (!Array.isArray(dia) || dia.length === 0) {
        throw new BadRequestException(
          `El dia ${diaIndex} debe tener un arreglo con al menos un id de ejercicio.`,
        );
      }

      return dia.map((ejercicioId) => {
        if (!Number.isInteger(ejercicioId) || ejercicioId <= 0) {
          throw new BadRequestException(
            `Todos los ids de ejercicios deben ser enteros mayores a 0. Error en el dia ${diaIndex}.`,
          );
        }

        return ejercicioId;
      });
    });
  }

  private normalizeRepeticiones(
    cantidadDias: number,
    repeticiones: Array<string[] | null>,
  ) {
    if (
      !Array.isArray(repeticiones) ||
      repeticiones.length !== PlanEntrenamientoService.DIAS_SEMANA
    ) {
      throw new BadRequestException(
        'La columna repeticiones debe contener exactamente 7 posiciones.',
      );
    }

    return repeticiones.map((dia, index) => {
      const diaIndex = index + 1;

      if (diaIndex > cantidadDias) {
        if (dia !== null) {
          throw new BadRequestException(
            `El dia ${diaIndex} de repeticiones debe enviarse como null porque excede la cantidad de dias configurada.`,
          );
        }

        return null;
      }

      if (!Array.isArray(dia) || dia.length === 0) {
        throw new BadRequestException(
          `El dia ${diaIndex} de repeticiones debe tener al menos un valor.`,
        );
      }

      return dia.map((repeticion, repIndex) => {
        const value = typeof repeticion === 'string' ? repeticion.trim() : '';
        if (!value) {
          throw new BadRequestException(
            `La repeticion de la posicion ${repIndex + 1} del dia ${diaIndex} es obligatoria.`,
          );
        }

        return value;
      });
    });
  }

  private validateAlignedData(
    ejercicios: Array<number[] | null>,
    repeticiones: Array<string[] | null>,
  ) {
    for (
      let index = 0;
      index < PlanEntrenamientoService.DIAS_SEMANA;
      index += 1
    ) {
      const ejerciciosDia = ejercicios[index];
      const repeticionesDia = repeticiones[index];
      const diaIndex = index + 1;

      if (ejerciciosDia === null || repeticionesDia === null) {
        if (ejerciciosDia !== repeticionesDia) {
          throw new BadRequestException(
            `El dia ${diaIndex} debe tener ejercicios y repeticiones, o ambos en null.`,
          );
        }

        continue;
      }

      if (ejerciciosDia.length !== repeticionesDia.length) {
        throw new BadRequestException(
          `El dia ${diaIndex} debe tener la misma cantidad de ejercicios y repeticiones.`,
        );
      }
    }
  }

  private formatPlanForResponse(plan: PlanEntrenamiento) {
    const ejerciciosVisibles = plan.ejercicios.filter(
      (dia): dia is number[] => Array.isArray(dia) && dia.length > 0,
    );

    const repeticionesVisibles = plan.repeticiones.filter(
      (dia): dia is string[] => Array.isArray(dia) && dia.length > 0,
    );

    const descripcionesDiasNormalizadas = Array.isArray(plan.descripcionesDias)
      ? plan.descripcionesDias
      : null;

    this.logger.debug(
      `[formatPlanForResponse] planId=${plan.id} rawDescripcionesDias=${JSON.stringify(plan.descripcionesDias)} normalized=${JSON.stringify(descripcionesDiasNormalizadas)}`,
    );

    return {
      ...plan,
      descripcionesDias: descripcionesDiasNormalizadas,
      descripciones_dias: descripcionesDiasNormalizadas,
      ejerciciosVisibles,
      repeticionesVisibles,
    };
  }

  async create(createPlanEntrenamientoDto: CreatePlanEntrenamientoDto) {
    const ejercicios = this.normalizeEjercicios(
      createPlanEntrenamientoDto.cantidadDias,
      createPlanEntrenamientoDto.ejercicios,
    );
    const repeticiones = this.normalizeRepeticiones(
      createPlanEntrenamientoDto.cantidadDias,
      createPlanEntrenamientoDto.repeticiones,
    );

    this.validateAlignedData(ejercicios, repeticiones);

    const insertPayload = {
      nombre: createPlanEntrenamientoDto.nombre.trim(),
      descripcion: createPlanEntrenamientoDto.descripcion?.trim() ?? null,
      tipo: 'predeterminado' as const,
      cantidadDias: createPlanEntrenamientoDto.cantidadDias,
      ejercicios,
      repeticiones,
      descripcionesDias: createPlanEntrenamientoDto.descripcionesDias ?? null,
    };

    const insertResult =
      await this.planEntrenamientoRepository.insert(insertPayload);
    const insertedId = Number(insertResult.identifiers[0]?.id);

    return {
      id: Number.isFinite(insertedId) ? insertedId : null,
      message: 'Plan de entrenamiento creado correctamente',
    };
  }

  async findAll() {
    const planes = await this.planEntrenamientoRepository.find({
      where: { tipo: 'predeterminado' },
      order: {
        id: 'ASC',
      },
    });

    return planes.map((plan) => this.formatPlanForResponse(plan));
  }

  async findOne(id: number) {
    return this.findPlanEntrenamientoById(id);
  }

  async findPlanEntrenamientoById(id: number) {
    const plan = await this.planEntrenamientoRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(
        `No se encontro el plan de entrenamiento con id ${id}`,
      );
    }

    return this.formatPlanForResponse(plan);
  }

  async findByUserId(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, planEntrenamientoId: true },
    });

    if (!user || !user.planEntrenamientoId) {
      return null;
    }

    const plan = await this.planEntrenamientoRepository.findOne({
      where: { id: user.planEntrenamientoId },
    });

    return plan ? this.formatPlanForResponse(plan) : null;
  }

  async findAssignmentByUserId(userId: number) {
    return this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, planEntrenamientoId: true },
    });
  }

  // Variante para el admin (GET /plan-entrenamiento/usuario/:userId): valida
  // que el usuario consultado exista antes de exponer su plan asignado.
  async findAssignmentByExistingUserId(userId: number) {
    await this.getUserById(userId);
    return this.findAssignmentByUserId(userId);
  }

  async assignPlanToUser(
    userId: number,
    planId: number,
  ): Promise<{ message: string }> {
    return this.executeWithDbRetry('assignPlanToUser', async () => {
      const user = await this.getUserById(userId);

      const previousPlanId = user.planEntrenamientoId;

      const planExists = await this.planEntrenamientoRepository.existsBy({
        id: planId,
      });
      if (!planExists) {
        throw new NotFoundException(
          `No se encontro el plan de entrenamiento con id ${planId}`,
        );
      }

      user.planEntrenamientoId = planId;
      await this.userRepository.save(user);

      if (previousPlanId !== planId) {
        await this.deletePlanIfUnused(previousPlanId);
      }

      return { message: 'Plan asignado correctamente' };
    });
  }

  async updatePlanForUser(
    userId: number,
    createPlanEntrenamientoDto: CreatePlanEntrenamientoDto,
  ) {
    const user = await this.getUserById(userId);

    const previousPlanId = user.planEntrenamientoId;

    const ejercicios = this.normalizeEjercicios(
      createPlanEntrenamientoDto.cantidadDias,
      createPlanEntrenamientoDto.ejercicios,
    );
    const repeticiones = this.normalizeRepeticiones(
      createPlanEntrenamientoDto.cantidadDias,
      createPlanEntrenamientoDto.repeticiones,
    );

    this.validateAlignedData(ejercicios, repeticiones);

    const insertPayload = {
      nombre: createPlanEntrenamientoDto.nombre.trim(),
      descripcion: createPlanEntrenamientoDto.descripcion?.trim() ?? null,
      tipo: 'editado' as const,
      cantidadDias: createPlanEntrenamientoDto.cantidadDias,
      ejercicios,
      repeticiones,
      descripcionesDias: createPlanEntrenamientoDto.descripcionesDias ?? null,
    };

    const insertResult =
      await this.planEntrenamientoRepository.insert(insertPayload);
    const insertedId = Number(insertResult.identifiers[0]?.id);

    if (!Number.isFinite(insertedId)) {
      throw new BadRequestException(
        'No se pudo crear el plan editado para el usuario.',
      );
    }

    user.planEntrenamientoId = insertedId;
    await this.userRepository.save(user);

    if (previousPlanId !== insertedId) {
      await this.deletePlanIfUnused(previousPlanId);
    }

    return {
      id: insertedId,
      tipo: 'editado',
      message: 'Plan personalizado del usuario actualizado correctamente',
    };
  }

  async update(
    id: number,
    updatePlanEntrenamientoDto: UpdatePlanEntrenamientoDto,
  ) {
    const plan = await this.planEntrenamientoRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(
        `No se encontro el plan de entrenamiento con id ${id}`,
      );
    }

    const cantidadDias =
      updatePlanEntrenamientoDto.cantidadDias ?? plan.cantidadDias;
    const ejercicios = this.normalizeEjercicios(
      cantidadDias,
      updatePlanEntrenamientoDto.ejercicios ?? plan.ejercicios,
    );
    const repeticiones = this.normalizeRepeticiones(
      cantidadDias,
      updatePlanEntrenamientoDto.repeticiones ?? plan.repeticiones,
    );

    this.validateAlignedData(ejercicios, repeticiones);

    plan.nombre = updatePlanEntrenamientoDto.nombre?.trim() ?? plan.nombre;
    plan.descripcion =
      updatePlanEntrenamientoDto.descripcion !== undefined
        ? updatePlanEntrenamientoDto.descripcion?.trim() || null
        : plan.descripcion;
    plan.descripcionesDias =
      updatePlanEntrenamientoDto.descripcionesDias !== undefined
        ? updatePlanEntrenamientoDto.descripcionesDias
        : plan.descripcionesDias;
    plan.cantidadDias = cantidadDias;
    plan.ejercicios = ejercicios;
    plan.repeticiones = repeticiones;

    const savedPlan = await this.planEntrenamientoRepository.save(plan);
    return this.formatPlanForResponse(savedPlan);
  }

  async remove(id: number) {
    const plan = await this.planEntrenamientoRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(
        `No se encontro el plan de entrenamiento con id ${id}`,
      );
    }

    if (plan.tipo === 'predeterminado') {
      throw new BadRequestException(
        'Los planes predeterminados no se pueden eliminar.',
      );
    }

    const usersUsingPlan = await this.userRepository.count({
      where: { planEntrenamientoId: id },
    });

    if (usersUsingPlan > 0) {
      throw new BadRequestException(
        'No se puede eliminar un plan editado que esta asignado a usuarios.',
      );
    }

    await this.planEntrenamientoRepository.delete(id);
    return { message: 'Plan de entrenamiento eliminado correctamente' };
  }
}
