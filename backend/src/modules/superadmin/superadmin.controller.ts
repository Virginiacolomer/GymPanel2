import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './superadmin.service';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import { SuperAdminLoginDto } from './dto/superadmin-login.dto';
import { SetupSecretGuard } from '../gimnasio/setup-secret.guard';

@Controller('superadmin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // Mismo mecanismo de bootstrap que la creacion de gimnasios: protegido por
  // secreto compartido en vez de JWT, porque todavia no existe ningun
  // superadmin logueado la primera vez que se usa.
  @UseGuards(SetupSecretGuard)
  @Post()
  create(@Body() createSuperAdminDto: CreateSuperAdminDto) {
    return this.superAdminService.create(createSuperAdminDto);
  }

  @Post('login')
  login(@Body() loginDto: SuperAdminLoginDto) {
    return this.superAdminService.login(loginDto);
  }
}
