import { IsInt, IsNotEmpty, IsString, Min, MaxLength } from 'class-validator';

export class CreateEjercicioDto {
  @IsString({ message: 'El nombre del ejercicio debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del ejercicio es obligatorio.' })
  @MaxLength(120, { message: 'El nombre del ejercicio no puede superar los 120 caracteres.' })
  nombre: string;

  @IsInt({ message: 'El grupo muscular debe ser numerico.' })
  @Min(1, { message: 'El grupo muscular debe ser mayor a 0.' })
  grupoMuscularId: number;
}