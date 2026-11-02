import * as bcrypt from 'bcrypt';
import {
  UserRole,
  UserStatus,
  UsuarioConCredenciales,
  UsuariosQuery,
} from '../../usuarios/contrato';
import {
  ContrasenaIncorrectaError,
  CuentaNoActivaError,
  EmailNoRegistradoError,
} from '../domain/errores-autenticacion';
import { IniciarSesion } from './iniciar-sesion';
import { DatosDelToken, EmisorDeTokens } from './puertos/emisor-de-tokens';

// Puertos falsos: el caso de uso se prueba sin base de datos ni JWT.
class UsuariosEnMemoria implements UsuariosQuery {
  constructor(private readonly usuarios: UsuarioConCredenciales[]) {}

  buscarPorEmail(email: string) {
    return Promise.resolve(
      this.usuarios.find((u) => u.email === email) ?? null,
    );
  }
}

class EmisorDeTokensFalso implements EmisorDeTokens {
  datos?: DatosDelToken;

  emitir(datos: DatosDelToken) {
    this.datos = datos;
    return Promise.resolve('token-de-test');
  }
}

describe('IniciarSesion', () => {
  const emisorDeTokens = new EmisorDeTokensFalso();
  let usuario: UsuarioConCredenciales;

  beforeAll(async () => {
    usuario = {
      id: 7,
      nombre: 'Tomas',
      apellido: 'Ferreyra',
      dni: '30111222',
      email: 'tomas@mail.com',
      role: UserRole.CLIENTE,
      estado: UserStatus.ACTIVO,
      planEntrenamientoId: null,
      passwordHash: await bcrypt.hash('secreto1', 4),
    };
  });

  function casoDeUso(usuarios: UsuarioConCredenciales[]) {
    return new IniciarSesion(new UsuariosEnMemoria(usuarios), emisorDeTokens);
  }

  it('devuelve el token y el usuario sin la contrasena', async () => {
    const resultado = await casoDeUso([usuario]).ejecutar(
      '  TOMAS@mail.com ',
      'secreto1',
    );

    const { passwordHash, ...sinPassword } = usuario;
    expect(resultado.user).toEqual(sinPassword);
    expect(resultado.accessToken).toBe('token-de-test');
    expect(emisorDeTokens.datos).toEqual({
      sub: 7,
      email: 'tomas@mail.com',
      role: 'CLIENTE',
    });
  });

  it('rechaza un email no registrado', async () => {
    await expect(
      casoDeUso([]).ejecutar('nadie@mail.com', 'secreto1'),
    ).rejects.toBeInstanceOf(EmailNoRegistradoError);
  });

  it('rechaza una contrasena incorrecta', async () => {
    await expect(
      casoDeUso([usuario]).ejecutar('tomas@mail.com', 'otra'),
    ).rejects.toBeInstanceOf(ContrasenaIncorrectaError);
  });

  it('verifica la contrasena antes que el estado de la cuenta', async () => {
    const creado = { ...usuario, estado: UserStatus.CREADO };
    await expect(
      casoDeUso([creado]).ejecutar('tomas@mail.com', 'otra'),
    ).rejects.toBeInstanceOf(ContrasenaIncorrectaError);
    await expect(
      casoDeUso([creado]).ejecutar('tomas@mail.com', 'secreto1'),
    ).rejects.toBeInstanceOf(CuentaNoActivaError);
  });
});
