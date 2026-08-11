import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateGrupoMuscularDto {
  @IsString({ message: 'El nombre del grupo muscular debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del grupo muscular es obligatorio.' })
  @MaxLength(120, { message: 'El nombre del grupo muscular no puede superar los 120 caracteres.' })
  nombre: string;
}
