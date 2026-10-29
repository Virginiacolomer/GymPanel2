import { ForbiddenException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    // BUSCAR USUARIO POR EMAIL
    const user = await this.userRepository.findOne({
      where: {
        email: loginDto.email.trim().toLowerCase(),
      },
    });

    if (!user) {
      throw new NotFoundException('El correo electronico no esta registrado.');
    }

    // VERIFICAR CONTRASEÑA
    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('La contrasena es incorrecta.');
    }

    if (user.estado !== UserStatus.ACTIVO) {
      throw new ForbiddenException('Espera que tu entrenador habilite tu cuenta!');
    }

    // RESPUESTA: Devolver usuario SIN password_hash
    const { password_hash, ...result } = user;
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET') || 'gympanel-dev-secret',
      },
    );

    return {
      accessToken,
      user: result,
    };
  }
}
