import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { SuperAdmin } from './entities/superadmin.entity';
import { CreateSuperAdminDto } from './dto/create-superadmin.dto';
import { SuperAdminLoginDto } from './dto/superadmin-login.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepository: Repository<SuperAdmin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async create(createSuperAdminDto: CreateSuperAdminDto): Promise<{ id: number; email: string }> {
    const normalizedEmail = createSuperAdminDto.email.trim().toLowerCase();

    const existing = await this.superAdminRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Ya existe un superadmin con ese correo electronico.');
    }

    const defaultRounds = process.env.NODE_ENV === 'production' ? 10 : 8;
    const configuredRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? defaultRounds);
    const saltRounds = Number.isFinite(configuredRounds) && configuredRounds > 3 ? configuredRounds : defaultRounds;

    const passwordHash = await bcrypt.hash(createSuperAdminDto.password, saltRounds);

    const superAdmin = this.superAdminRepository.create({ email: normalizedEmail, passwordHash });
    const saved = await this.superAdminRepository.save(superAdmin);

    return { id: saved.id, email: saved.email };
  }

  async login(loginDto: SuperAdminLoginDto) {
    const superAdmin = await this.superAdminRepository.findOne({
      where: { email: loginDto.email.trim().toLowerCase() },
    });

    if (!superAdmin) {
      throw new UnauthorizedException('Correo electronico o contrasena incorrectos.');
    }

    const passwordValid = await bcrypt.compare(loginDto.password, superAdmin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Correo electronico o contrasena incorrectos.');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: superAdmin.id,
        email: superAdmin.email,
        role: UserRole.SUPERADMIN,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
      },
    );

    return {
      accessToken,
      superAdmin: { id: superAdmin.id, email: superAdmin.email },
    };
  }
}
