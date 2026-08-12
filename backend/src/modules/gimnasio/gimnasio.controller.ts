import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { GimnasioService } from './gimnasio.service';
import { CreateGimnasioDto } from './dto/create-gimnasio.dto';
import { UpdateGimnasioContactoDto } from './dto/update-gimnasio-contacto.dto';
import { SetupSecretGuard } from './setup-secret.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthenticatedRequest } from '../auth/jwt-payload.interface';

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

  // El gimnasio se identifica por el gimnasioId del propio JWT, nunca por un
  // :id de ruta: asi un admin/cliente solo puede ver o editar los datos de
  // contacto del gimnasio al que pertenece su cuenta.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENTE)
  @Get('mi-gimnasio')
  findMyGimnasioContactInfo(@Req() request: AuthenticatedRequest) {
    return this.gimnasioService.findContactInfo(request.user.gimnasioId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('mi-gimnasio')
  updateMyGimnasioContactInfo(
    @Req() request: AuthenticatedRequest,
    @Body() updateGimnasioContactoDto: UpdateGimnasioContactoDto,
  ) {
    return this.gimnasioService.updateContactInfo(request.user.gimnasioId, updateGimnasioContactoDto);
  }
}
