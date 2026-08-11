import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateEjercicioDto {
  @IsOptional()
  @IsString({ message: 'El nombre del ejercicio debe ser texto.' })
  @MaxLength(120, { message: 'El nombre del ejercicio no puede superar los 120 caracteres.' })
  nombre?: string;

  @IsOptional()
  @IsInt({ message: 'El grupo muscular debe ser numerico.' })
  @Min(1, { message: 'El grupo muscular debe ser mayor a 0.' })
  grupoMuscularId?: number;
}
