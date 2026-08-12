import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGimnasioContactoDto {
  @IsOptional()
  @IsString({ message: 'El instagram debe ser texto.' })
  @MaxLength(120)
  instagram?: string;

  @IsOptional()
  @IsString({ message: 'El telefono debe ser texto.' })
  @MaxLength(60)
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'La direccion debe ser texto.' })
  @MaxLength(200)
  direccion?: string;
}
