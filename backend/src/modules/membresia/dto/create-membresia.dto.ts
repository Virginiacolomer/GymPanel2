import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateMembresiaDto {
	@IsNotEmpty({ message: 'El nombre de la membresia es obligatorio.' })
	@IsString({ message: 'El nombre de la membresia debe ser texto.' })
	nombre: string;

	@IsOptional()
	@IsString({ message: 'La descripcion de la membresia debe ser texto.' })
	@MaxLength(500, { message: 'La descripcion de la membresia no puede superar los 500 caracteres.' })
	descripcion?: string;

	@Type(() => Number)
	@IsInt({ message: 'La frecuencia de la membresia debe ser un numero entero.' })
	@Min(1, { message: 'La frecuencia de la membresia debe ser al menos 1.' })
	dias: number;

	@Type(() => Number)
	@IsInt({ message: 'El costo de la membresia debe ser un numero entero.' })
	@IsPositive({ message: 'El costo de la membresia debe ser mayor a 0.' })
	costo: number;
}
