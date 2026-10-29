import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El correo electronico es obligatorio.' })
  @IsEmail({}, { message: 'Ingresa un correo electronico valido.' })
  email: string;
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre debe ser un texto valido.' })
  nombre: string;
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @IsString({ message: 'El apellido debe ser un texto valido.' })
  apellido: string;
  @IsNotEmpty({ message: 'El dni es obligatorio.' })
  dni: string;
  @IsNotEmpty({ message: 'La contrasena es obligatoria.' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres.' })
  password: string;
}
