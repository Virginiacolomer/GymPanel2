import { IsEnum } from 'class-validator';
import { PlanGimnasio } from '../enums/plan-gimnasio.enum';

export class UpdatePlanGimnasioDto {
  @IsEnum(PlanGimnasio, { message: 'Plan invalido.' })
  plan: PlanGimnasio;
}
