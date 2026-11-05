import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../usuarios';
import {
  AsignacionDeUsuario,
  AsignacionesDePlan,
} from '../application/puertos/asignaciones-de-plan';

// Unico lugar de Planes que conoce la entidad User: la asignacion se guarda en
// user.plan_entrenamiento_id (ver la deuda tecnica de la seccion 4 en
// AGENTS.md). Si la asignacion pasa a otro lado, solo cambia este adapter.
@Injectable()
export class TypeOrmAsignacionesDePlan implements AsignacionesDePlan {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async buscar(userId: number): Promise<AsignacionDeUsuario | null> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, planEntrenamientoId: true },
    });
    if (!user) {
      return null;
    }
    // La columna es bigint: llega como string.
    const planId =
      user.planEntrenamientoId === null
        ? null
        : Number(user.planEntrenamientoId);
    return { userId: user.id, planId };
  }

  async asignar(userId: number, planId: number): Promise<void> {
    await this.users.update({ id: userId }, { planEntrenamientoId: planId });
  }

  contarUsuariosConPlan(planId: number): Promise<number> {
    return this.users.count({ where: { planEntrenamientoId: planId } });
  }
}
