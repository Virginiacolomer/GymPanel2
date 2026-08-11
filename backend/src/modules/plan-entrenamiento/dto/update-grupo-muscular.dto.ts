import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGrupoMuscularDto {
  @IsOptional()
  @IsString({ message: 'El nombre del grupo muscular debe ser texto.' })
  @MaxLength(120, { message: 'El nombre del grupo muscular no puede superar los 120 caracteres.' })
  nombre?: string;
}
