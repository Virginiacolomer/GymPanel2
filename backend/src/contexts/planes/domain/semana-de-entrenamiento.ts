import { ValueObject } from '../../../shared/domain/value-object';
import { SemanaInvalidaError } from './errores-planes';

export type EjerciciosPorDia = Array<number[] | null>;
export type RepeticionesPorDia = Array<string[] | null>;

interface SemanaProps {
  cantidadDias: number;
  ejercicios: EjerciciosPorDia;
  repeticiones: RepeticionesPorDia;
}

// La semana de un plan: 7 posiciones fijas, una por dia. Los dias activos
// (1..cantidadDias) tienen ejercicios y repeticiones alineados uno a uno; los
// que exceden cantidadDias van en null.
export class SemanaDeEntrenamiento extends ValueObject<SemanaProps> {
  static readonly DIAS_SEMANA = 7;

  static crear(
    cantidadDias: number,
    ejercicios: EjerciciosPorDia,
    repeticiones: RepeticionesPorDia,
  ): SemanaDeEntrenamiento {
    const ejerciciosValidos = SemanaDeEntrenamiento.normalizarEjercicios(
      cantidadDias,
      ejercicios,
    );
    const repeticionesValidas = SemanaDeEntrenamiento.normalizarRepeticiones(
      cantidadDias,
      repeticiones,
    );
    SemanaDeEntrenamiento.validarAlineacion(
      ejerciciosValidos,
      repeticionesValidas,
    );

    return new SemanaDeEntrenamiento({
      cantidadDias,
      ejercicios: ejerciciosValidos,
      repeticiones: repeticionesValidas,
    });
  }

  // Para datos que ya estan guardados: no se vuelven a validar.
  static reconstruir(
    cantidadDias: number,
    ejercicios: EjerciciosPorDia,
    repeticiones: RepeticionesPorDia,
  ): SemanaDeEntrenamiento {
    return new SemanaDeEntrenamiento({
      cantidadDias,
      ejercicios,
      repeticiones,
    });
  }

  get cantidadDias(): number {
    return this.props.cantidadDias;
  }

  get ejercicios(): EjerciciosPorDia {
    return this.props.ejercicios;
  }

  get repeticiones(): RepeticionesPorDia {
    return this.props.repeticiones;
  }

  private static normalizarEjercicios(
    cantidadDias: number,
    ejercicios: EjerciciosPorDia,
  ): EjerciciosPorDia {
    if (
      !Array.isArray(ejercicios) ||
      ejercicios.length !== SemanaDeEntrenamiento.DIAS_SEMANA
    ) {
      throw new SemanaInvalidaError(
        'La columna ejercicios debe contener exactamente 7 posiciones.',
      );
    }

    return ejercicios.map((dia, index) => {
      const diaIndex = index + 1;

      if (diaIndex > cantidadDias) {
        if (dia !== null) {
          throw new SemanaInvalidaError(
            `El dia ${diaIndex} debe enviarse como null porque excede la cantidad de dias configurada.`,
          );
        }

        return null;
      }

      if (!Array.isArray(dia) || dia.length === 0) {
        throw new SemanaInvalidaError(
          `El dia ${diaIndex} debe tener un arreglo con al menos un id de ejercicio.`,
        );
      }

      return dia.map((ejercicioId) => {
        if (!Number.isInteger(ejercicioId) || ejercicioId <= 0) {
          throw new SemanaInvalidaError(
            `Todos los ids de ejercicios deben ser enteros mayores a 0. Error en el dia ${diaIndex}.`,
          );
        }

        return ejercicioId;
      });
    });
  }

  private static normalizarRepeticiones(
    cantidadDias: number,
    repeticiones: RepeticionesPorDia,
  ): RepeticionesPorDia {
    if (
      !Array.isArray(repeticiones) ||
      repeticiones.length !== SemanaDeEntrenamiento.DIAS_SEMANA
    ) {
      throw new SemanaInvalidaError(
        'La columna repeticiones debe contener exactamente 7 posiciones.',
      );
    }

    return repeticiones.map((dia, index) => {
      const diaIndex = index + 1;

      if (diaIndex > cantidadDias) {
        if (dia !== null) {
          throw new SemanaInvalidaError(
            `El dia ${diaIndex} de repeticiones debe enviarse como null porque excede la cantidad de dias configurada.`,
          );
        }

        return null;
      }

      if (!Array.isArray(dia) || dia.length === 0) {
        throw new SemanaInvalidaError(
          `El dia ${diaIndex} de repeticiones debe tener al menos un valor.`,
        );
      }

      return dia.map((repeticion, repIndex) => {
        const value = typeof repeticion === 'string' ? repeticion.trim() : '';
        if (!value) {
          throw new SemanaInvalidaError(
            `La repeticion de la posicion ${repIndex + 1} del dia ${diaIndex} es obligatoria.`,
          );
        }

        return value;
      });
    });
  }

  private static validarAlineacion(
    ejercicios: EjerciciosPorDia,
    repeticiones: RepeticionesPorDia,
  ): void {
    for (let index = 0; index < SemanaDeEntrenamiento.DIAS_SEMANA; index += 1) {
      const ejerciciosDia = ejercicios[index];
      const repeticionesDia = repeticiones[index];
      const diaIndex = index + 1;

      if (ejerciciosDia === null || repeticionesDia === null) {
        if (ejerciciosDia !== repeticionesDia) {
          throw new SemanaInvalidaError(
            `El dia ${diaIndex} debe tener ejercicios y repeticiones, o ambos en null.`,
          );
        }

        continue;
      }

      if (ejerciciosDia.length !== repeticionesDia.length) {
        throw new SemanaInvalidaError(
          `El dia ${diaIndex} debe tener la misma cantidad de ejercicios y repeticiones.`,
        );
      }
    }
  }
}
