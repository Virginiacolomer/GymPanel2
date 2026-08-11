import { PartialType } from '@nestjs/mapped-types';
import { CreateMembresiaDto } from './create-membresia.dto';

export class UpdateMembresiaDto extends PartialType(CreateMembresiaDto) {}
