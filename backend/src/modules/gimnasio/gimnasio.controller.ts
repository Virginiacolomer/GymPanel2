import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GimnasioService } from './gimnasio.service';
import { CreateGimnasioDto } from './dto/create-gimnasio.dto';
import { SetupSecretGuard } from './setup-secret.guard';

@Controller('gimnasios')
export class GimnasioController {
  constructor(private readonly gimnasioService: GimnasioService) {}

  // Publico: alimenta el selector de gimnasio en login/registro.
  @Get()
  findAllActive() {
    return this.gimnasioService.findAllActive();
  }

  // Alta de un gimnasio nuevo (onboarding de un cliente de la plataforma).
  // Protegido por secreto compartido en vez de JWT porque el gimnasio
  // todavia no tiene ningun usuario admin creado.
  @UseGuards(SetupSecretGuard)
  @Post()
  create(@Body() createGimnasioDto: CreateGimnasioDto) {
    return this.gimnasioService.create(createGimnasioDto);
  }
}
