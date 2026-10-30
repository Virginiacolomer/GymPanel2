import { NombreEjercicio } from './nombre-ejercicio.vo';
import { NombreEjercicioVacioError } from './errores-ejercicios';

describe('NombreEjercicio', () => {
  it('normaliza a mayusculas, elimina espacios en los extremos y colapsa espacios internos', () => {
    const nombre = NombreEjercicio.crear('   press   de   banca   ');
    expect(nombre.valor).toBe('PRESS DE BANCA');
  });

  it('lanza NombreEjercicioVacioError si el string esta vacio o solo tiene espacios', () => {
    expect(() => NombreEjercicio.crear('')).toThrow(NombreEjercicioVacioError);
    expect(() => NombreEjercicio.crear('   ')).toThrow(
      NombreEjercicioVacioError,
    );
    expect(() => NombreEjercicio.crear(null as unknown as string)).toThrow(
      NombreEjercicioVacioError,
    );
  });

  it('compara igualdad por valor correctamente', () => {
    const a = NombreEjercicio.crear('sentadilla');
    const b = NombreEjercicio.crear('  SENTADILLA  ');
    const c = NombreEjercicio.crear('peso muerto');

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
