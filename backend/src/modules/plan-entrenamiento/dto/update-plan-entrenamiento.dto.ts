import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanEntrenamientoDto } from './create-plan-entrenamiento.dto';

export class UpdatePlanEntrenamientoDto extends PartialType(CreatePlanEntrenamientoDto) {}
