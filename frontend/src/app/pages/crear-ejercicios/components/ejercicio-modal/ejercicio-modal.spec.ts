import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EjercicioModalComponent, SaveEjercicioEvent } from './ejercicio-modal';

describe('EjercicioModalComponent', () => {
  let component: EjercicioModalComponent;
  let fixture: ComponentFixture<EjercicioModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjercicioModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EjercicioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit save with full exercise data when submit() is called on valid form', () => {
    let savedEvent: SaveEjercicioEvent | null = null;
    component.save.subscribe((val) => (savedEvent = val));

    component.form.setValue({
      nombre: 'Press militar',
      grupoMuscularId: 2,
      equipamiento: 'Mancuernas (Peso libre)',
      descripcion: 'Ejercicio para hombros',
      tecnica: '1. Sentarse erguido. 2. Empujar hacia arriba.',
    });
    component.submit();

    expect(savedEvent).toBeTruthy();
    expect(savedEvent!.nombre).toBe('Press militar');
    expect(savedEvent!.grupoMuscularId).toBe(2);
    expect(savedEvent!.equipamiento).toBe('Mancuernas (Peso libre)');
    expect(savedEvent!.descripcion).toBe('Ejercicio para hombros');
    expect(savedEvent!.tecnica).toBe('1. Sentarse erguido. 2. Empujar hacia arriba.');
  });

  it('should not emit save when form is invalid', () => {
    let emitted = false;
    component.save.subscribe(() => (emitted = true));

    component.form.setValue({
      nombre: '   ',
      grupoMuscularId: null,
      equipamiento: '',
      descripcion: '',
      tecnica: '',
    });
    component.submit();

    expect(emitted).toBe(false);
  });
});
