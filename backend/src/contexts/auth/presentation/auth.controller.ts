import { Controller, Post, Body } from '@nestjs/common';
import { IniciarSesion } from '../application/iniciar-sesion';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly iniciarSesion: IniciarSesion) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.iniciarSesion.ejecutar(loginDto.email, loginDto.password);
  }
}
