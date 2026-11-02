import { IsEnum } from 'class-validator';
import { UserStatus } from '../../domain/value-objects/estado-usuario.vo';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus, { message: 'Estado invalido.' })
  estado: UserStatus;
}
