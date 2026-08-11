import { IsEmail, IsInt, IsNotEmpty, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class LoginDto {
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un gimnasio valido.' })
  @Min(1, { message: 'Selecciona un gimnasio valido.' })
  gimnasioId: number;

  @IsNotEmpty({ message: 'El correo electronico es obligatorio.' })
  @IsEmail({}, { message: 'Ingresa un correo electronico valido.' })
  email: string;

  @IsNotEmpty({ message: 'La contrasena es obligatoria.' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres.' })
  password: string;
}
