import { NombreGrupoMuscular } from './nombre-grupo-muscular.vo';
import { NombreGrupoMuscularVacioError } from './errores-ejercicios';

describe('NombreGrupoMuscular', () => {
  it('normaliza a mayusculas, elimina espacios en los extremos y colapsa espacios internos', () => {
    const nombre = NombreGrupoMuscular.crear('   pecho   alto   ');
    expect(nombre.valor).toBe('PECHO ALTO');
  });

  it('lanza NombreGrupoMuscularVacioError si el string esta vacio o solo tiene espacios', () => {
    expect(() => NombreGrupoMuscular.crear('')).toThrow(
      NombreGrupoMuscularVacioError,
    );
    expect(() => NombreGrupoMuscular.crear('   ')).toThrow(
      NombreGrupoMuscularVacioError,
    );
    expect(() => NombreGrupoMuscular.crear(null as unknown as string)).toThrow(
      NombreGrupoMuscularVacioError,
    );
  });

  it('compara igualdad por valor correctamente', () => {
    const a = NombreGrupoMuscular.crear('espalda');
    const b = NombreGrupoMuscular.crear('  ESPALDA  ');
    const c = NombreGrupoMuscular.crear('piernas');

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
