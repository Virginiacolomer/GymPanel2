import { Module } from '@nestjs/common';
import { HASHER_CONTRASENAS } from '../domain/hasher-contrasenas';
import { BcryptHasherContrasenas } from './bcrypt-hasher-contrasenas';

@Module({
  providers: [
    { provide: HASHER_CONTRASENAS, useClass: BcryptHasherContrasenas },
  ],
  exports: [HASHER_CONTRASENAS],
})
export class HasherContrasenasModule {}
