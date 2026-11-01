import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EjerciciosListComponent } from './ejercicios-list';
import { CatalogoEjercicio } from '../../../../core/services/plan-entrenamiento-api.service';

describe('EjerciciosListComponent', () => {
  let component: EjerciciosListComponent;
  let fixture: ComponentFixture<EjerciciosListComponent>;

  const mockEjercicios: CatalogoEjercicio[] = [
    { id: 1, nombre: 'Press de Banca', imagenUrl: 'https://example.com/press.jpg' },
    { id: 2, nombre: 'Aperturas', imagenUrl: null },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjerciciosListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EjerciciosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start inline edit with current name', () => {
    component.startEdit(mockEjercicios[0]);
    expect(component.editingEjercicioId).toBe(1);
    expect(component.editEjercicioForm.getRawValue().nombre).toBe('Press de Banca');
  });

  it('should cancel edit and reset form', () => {
    component.startEdit(mockEjercicios[0]);
    component.cancelEdit();
    expect(component.editingEjercicioId).toBeNull();
    expect(component.editEjercicioForm.getRawValue().nombre).toBe('');
  });

  it('should emit saveEdit with trimmed name on valid submission', () => {
    let saved: { id: number; nombre: string } | undefined;
    component.saveEdit.subscribe((val) => {
      saved = val;
    });

    component.startEdit(mockEjercicios[0]);
    component.editEjercicioForm.setValue({ nombre: '  Press Plano  ' });
    component.submitEdit(1);

    expect(saved).toEqual({ id: 1, nombre: 'Press Plano' });
    expect(component.editingEjercicioId).toBeNull();
  });

  it('should not emit saveEdit when form is invalid', () => {
    let emitted = false;
    component.saveEdit.subscribe(() => {
      emitted = true;
    });

    component.startEdit(mockEjercicios[0]);
    component.editEjercicioForm.setValue({ nombre: '   ' });
    component.submitEdit(1);

    expect(emitted).toBe(false);
  });

  it('should emit uploadImage and deleteEjercicio', () => {
    let uploadTarget: CatalogoEjercicio | undefined;
    let deleteTarget: CatalogoEjercicio | undefined;

    component.uploadImage.subscribe((ej) => {
      uploadTarget = ej;
    });
    component.deleteEjercicio.subscribe((ej) => {
      deleteTarget = ej;
    });

    component.uploadImage.emit(mockEjercicios[0]);
    component.deleteEjercicio.emit(mockEjercicios[1]);

    expect(uploadTarget).toBe(mockEjercicios[0]);
    expect(deleteTarget).toBe(mockEjercicios[1]);
  });
});

