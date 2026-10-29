import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El correo electronico es obligatorio.' })
  @IsEmail({}, { message: 'Ingresa un correo electronico valido.' })
  email: string;

  @IsNotEmpty({ message: 'La contrasena es obligatoria.' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres.' })
  password: string;
}
