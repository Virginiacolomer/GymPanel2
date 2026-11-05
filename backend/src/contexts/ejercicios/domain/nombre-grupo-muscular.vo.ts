import { NombreTexto } from './nombre-texto.vo';
import { NombreGrupoMuscularVacioError } from './errores-ejercicios';

export class NombreGrupoMuscular extends NombreTexto {
  static crear(raw: string): NombreGrupoMuscular {
    const valor = this.normalizar(raw);
    if (!valor) {
      throw new NombreGrupoMuscularVacioError();
    }
    return new NombreGrupoMuscular({ valor });
  }

  static reconstruir(valor: string): NombreGrupoMuscular {
    return new NombreGrupoMuscular({ valor });
  }
}
