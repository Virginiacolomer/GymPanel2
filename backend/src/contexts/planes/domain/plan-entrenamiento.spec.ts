import { DatosPlan, PlanEntrenamiento } from './plan-entrenamiento';
import {
  PlanEditadoAsignadoNoSeEliminaError,
  PlanPredeterminadoNoSeEliminaError,
  SemanaInvalidaError,
} from './errores-planes';

const datos = (cambios: Partial<DatosPlan> = {}): DatosPlan => ({
  nombre: '  Fuerza  ',
  descripcion: '  Plan base  ',
  cantidadDias: 1,
  ejercicios: [[10], null, null, null, null, null, null],
  repeticiones: [['4x10'], null, null, null, null, null, null],
  ...cambios,
});

describe('PlanEntrenamiento', () => {
  describe('al crearse', () => {
    it('crearPredeterminado arma un plan predeterminado con nombre y descripcion recortados', () => {
      const plan = PlanEntrenamiento.crearPredeterminado(datos());

      expect(plan.tipo).toBe('predeterminado');
      expect(plan.nombre).toBe('Fuerza');
      expect(plan.descripcion).toBe('Plan base');
      expect(plan.descripcionesDias).toBeNull();
    });

    it('crearEditado arma una copia editada', () => {
      expect(PlanEntrenamiento.crearEditado(datos()).tipo).toBe('editado');
    });

    it('sin descripcion queda en null, pero una descripcion vacia se conserva', () => {
      expect(
        PlanEntrenamiento.crearPredeterminado(datos({ descripcion: undefined }))
          .descripcion,
      ).toBeNull();
      expect(
        PlanEntrenamiento.crearPredeterminado(datos({ descripcion: '' }))
          .descripcion,
      ).toBe('');
    });

    it('rechaza una semana invalida', () => {
      expect(() =>
        PlanEntrenamiento.crearPredeterminado(datos({ ejercicios: [] })),
      ).toThrow(SemanaInvalidaError);
    });
  });

  describe('editar', () => {
    it('cambia solo lo que se envia y una descripcion vacia pasa a null', () => {
      const plan = PlanEntrenamiento.crearPredeterminado(datos());

      plan.editar({ nombre: ' Nuevo ', descripcion: '' });

      expect(plan.nombre).toBe('Nuevo');
      expect(plan.descripcion).toBeNull();
      expect(plan.semana.cantidadDias).toBe(1);
    });

    it('revalida la semana combinando lo enviado con lo que ya tenia', () => {
      const plan = PlanEntrenamiento.crearPredeterminado(datos());

      expect(() => plan.editar({ cantidadDias: 2 })).toThrow(
        'El dia 2 debe tener un arreglo con al menos un id de ejercicio.',
      );
    });

    it('no cambia nada si la semana nueva es invalida', () => {
      const plan = PlanEntrenamiento.crearPredeterminado(datos());

      expect(() => plan.editar({ nombre: 'Otro', cantidadDias: 2 })).toThrow(
        SemanaInvalidaError,
      );
      expect(plan.nombre).toBe('Fuerza');
    });
  });

  describe('eliminar', () => {
    it('un predeterminado no se elimina nunca', () => {
      const plan = PlanEntrenamiento.crearPredeterminado(datos());
      expect(() => plan.verificarQueSePuedeEliminar(0)).toThrow(
        PlanPredeterminadoNoSeEliminaError,
      );
    });

    it('un editado asignado a usuarios no se elimina', () => {
      const plan = PlanEntrenamiento.crearEditado(datos());
      expect(() => plan.verificarQueSePuedeEliminar(1)).toThrow(
        PlanEditadoAsignadoNoSeEliminaError,
      );
      expect(() => plan.verificarQueSePuedeEliminar(0)).not.toThrow();
    });
  });

  describe('debeDescartarse (al reasignar)', () => {
    it('solo se descarta un editado que quedo sin usuarios', () => {
      const editado = PlanEntrenamiento.crearEditado(datos());
      const predeterminado = PlanEntrenamiento.crearPredeterminado(datos());

      expect(editado.debeDescartarse(0)).toBe(true);
      expect(editado.debeDescartarse(1)).toBe(false);
      expect(predeterminado.debeDescartarse(0)).toBe(false);
    });
  });
});
