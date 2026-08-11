import {
ArrayMaxSize,
ArrayMinSize,
IsArray,
IsInt,
IsNotEmpty,
IsOptional,
IsString,
Max,
MaxLength,
Min,
} from 'class-validator';

export class CreatePlanEntrenamientoDto {
@IsString({ message: 'El nombre del plan debe ser texto.' })
@IsNotEmpty({ message: 'El nombre del plan es obligatorio.' })
@MaxLength(120, { message: 'El nombre del plan no puede superar los 120 caracteres.' })
nombre: string;

@IsOptional()
@IsString({ message: 'La descripcion debe ser texto.' })
@MaxLength(500, { message: 'La descripcion no puede superar los 500 caracteres.' })
descripcion?: string;

@IsInt({ message: 'La cantidad de dias debe ser numerica.' })
@Min(1, { message: 'La cantidad de dias debe ser al menos 1.' })
@Max(7, { message: 'La cantidad de dias no puede ser mayor a 7.' })
cantidadDias: number;

@IsArray({ message: 'Los ejercicios deben enviarse como arreglo.' })
@ArrayMinSize(7, { message: 'El arreglo de ejercicios debe tener 7 posiciones.' })
@ArrayMaxSize(7, { message: 'El arreglo de ejercicios debe tener 7 posiciones.' })
ejercicios: Array<number[] | null>;

@IsArray({ message: 'Las repeticiones deben enviarse como arreglo.' })
@ArrayMinSize(7, { message: 'El arreglo de repeticiones debe tener 7 posiciones.' })
@ArrayMaxSize(7, { message: 'El arreglo de repeticiones debe tener 7 posiciones.' })
repeticiones: Array<string[] | null>;

@IsOptional()
@IsArray({ message: 'Las descripciones de dias deben enviarse como arreglo.' })
@ArrayMinSize(7, { message: 'El arreglo de descripciones debe tener 7 posiciones.' })
@ArrayMaxSize(7, { message: 'El arreglo de descripciones debe tener 7 posiciones.' })
descripcionesDias?: Array<string | null>;
}
