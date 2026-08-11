import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateGimnasioDto {
  @IsNotEmpty({ message: 'El nombre del gimnasio es obligatorio.' })
  @IsString({ message: 'El nombre del gimnasio debe ser texto.' })
  @MaxLength(120, { message: 'El nombre del gimnasio no puede superar los 120 caracteres.' })
  nombre: string;

  @IsNotEmpty({ message: 'El identificador (slug) del gimnasio es obligatorio.' })
  @IsString({ message: 'El identificador del gimnasio debe ser texto.' })
  @MaxLength(80, { message: 'El identificador del gimnasio no puede superar los 80 caracteres.' })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'El identificador solo puede tener minusculas, numeros y guiones (ej: mi-gimnasio).',
  })
  slug: string;

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
