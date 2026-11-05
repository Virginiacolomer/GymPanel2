import { SemanaDeEntrenamiento } from './semana-de-entrenamiento';
import { SemanaInvalidaError } from './errores-planes';

// Semana de 1 dia activo con un ejercicio; el resto en null.
const ejerciciosUnDia = () => [[10], null, null, null, null, null, null];
const repeticionesUnDia = () => [['4x10'], null, null, null, null, null, null];

describe('SemanaDeEntrenamiento', () => {
  it('crea una semana valida y recorta los espacios de las repeticiones', () => {
    const repeticiones = repeticionesUnDia();
    repeticiones[0] = ['  4x10  '];

    const semana = SemanaDeEntrenamiento.crear(
      1,
      ejerciciosUnDia(),
      repeticiones,
    );

    expect(semana.cantidadDias).toBe(1);
    expect(semana.ejercicios).toEqual(ejerciciosUnDia());
    expect(semana.repeticiones).toEqual(repeticionesUnDia());
  });

  it('exige exactamente 7 posiciones en ejercicios y en repeticiones', () => {
    expect(() =>
      SemanaDeEntrenamiento.crear(1, [[10]], repeticionesUnDia()),
    ).toThrow(
      new SemanaInvalidaError(
        'La columna ejercicios debe contener exactamente 7 posiciones.',
      ),
    );
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejerciciosUnDia(), [['4x10']]),
    ).toThrow(
      new SemanaInvalidaError(
        'La columna repeticiones debe contener exactamente 7 posiciones.',
      ),
    );
  });

  it('los dias que exceden cantidadDias deben venir en null', () => {
    const ejercicios = ejerciciosUnDia();
    ejercicios[1] = [10];

    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejercicios, repeticionesUnDia()),
    ).toThrow(
      'El dia 2 debe enviarse como null porque excede la cantidad de dias configurada.',
    );

    const repeticiones = repeticionesUnDia();
    repeticiones[1] = ['3x8'];
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejerciciosUnDia(), repeticiones),
    ).toThrow(
      'El dia 2 de repeticiones debe enviarse como null porque excede la cantidad de dias configurada.',
    );
  });

  it('cada dia activo tiene al menos un ejercicio y una repeticion', () => {
    const ejercicios = ejerciciosUnDia();
    ejercicios[0] = [];
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejercicios, repeticionesUnDia()),
    ).toThrow(
      'El dia 1 debe tener un arreglo con al menos un id de ejercicio.',
    );

    const repeticiones = repeticionesUnDia();
    repeticiones[0] = null;
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejerciciosUnDia(), repeticiones),
    ).toThrow('El dia 1 de repeticiones debe tener al menos un valor.');
  });

  it('los ids de ejercicio son enteros mayores a 0', () => {
    const ejercicios = ejerciciosUnDia();
    ejercicios[0] = [0];
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejercicios, repeticionesUnDia()),
    ).toThrow(
      'Todos los ids de ejercicios deben ser enteros mayores a 0. Error en el dia 1.',
    );
  });

  it('una repeticion vacia no es valida', () => {
    const repeticiones = repeticionesUnDia();
    repeticiones[0] = ['   '];
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejerciciosUnDia(), repeticiones),
    ).toThrow('La repeticion de la posicion 1 del dia 1 es obligatoria.');
  });

  it('ejercicios y repeticiones de un dia tienen la misma cantidad', () => {
    const repeticiones = repeticionesUnDia();
    repeticiones[0] = ['4x10', '3x8'];
    expect(() =>
      SemanaDeEntrenamiento.crear(1, ejerciciosUnDia(), repeticiones),
    ).toThrow(
      'El dia 1 debe tener la misma cantidad de ejercicios y repeticiones.',
    );
  });

  it('reconstruir no vuelve a validar los datos guardados', () => {
    const semana = SemanaDeEntrenamiento.reconstruir(3, [], []);
    expect(semana.cantidadDias).toBe(3);
  });
});
