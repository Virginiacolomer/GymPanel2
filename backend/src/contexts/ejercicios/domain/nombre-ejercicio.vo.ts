import { NombreTexto } from './nombre-texto.vo';
import { NombreEjercicioVacioError } from './errores-ejercicios';

export class NombreEjercicio extends NombreTexto {
  static crear(raw: string): NombreEjercicio {
    const valor = this.normalizar(raw);
    if (!valor) {
      throw new NombreEjercicioVacioError();
    }
    return new NombreEjercicio({ valor });
  }

  static reconstruir(valor: string): NombreEjercicio {
    return new NombreEjercicio({ valor });
  }
}
