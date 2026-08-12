import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHorarioDto {
  @IsNotEmpty({ message: 'La descripcion es obligatoria.' })
  @IsString({ message: 'La descripcion debe ser texto.' })
  @MaxLength(120, { message: 'La descripcion no puede superar los 120 caracteres.' })
  descripcion: string;

  @IsNotEmpty({ message: 'El horario es obligatorio.' })
  @IsString({ message: 'El horario debe ser texto.' })
  @MaxLength(60, { message: 'El horario no puede superar los 60 caracteres.' })
  horario: string;
}
