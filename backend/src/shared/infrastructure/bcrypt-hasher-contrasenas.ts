import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HasherContrasenas } from '../domain/hasher-contrasenas';

@Injectable()
export class BcryptHasherContrasenas implements HasherContrasenas {
  hashear(contrasena: string): Promise<string> {
    return bcrypt.hash(contrasena, this.rondas());
  }

  comparar(contrasena: string, hash: string): Promise<boolean> {
    return bcrypt.compare(contrasena, hash);
  }

  private rondas(): number {
    const porDefecto = process.env.NODE_ENV === 'production' ? 10 : 8;
    const configuradas = Number(process.env.BCRYPT_SALT_ROUNDS ?? porDefecto);
    return Number.isFinite(configuradas) && configuradas > 3
      ? configuradas
      : porDefecto;
  }
}
