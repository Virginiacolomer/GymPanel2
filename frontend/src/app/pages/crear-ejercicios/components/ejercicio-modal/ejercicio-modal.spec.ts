import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EjercicioModalComponent } from './ejercicio-modal';

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

  it('should emit save with trimmed exercise name when submit() is called on valid form', () => {
    let savedNombre = '';
    component.save.subscribe((val) => (savedNombre = val));

    component.form.setValue({ nombre: 'Press militar' });
    component.submit();

    expect(savedNombre).toBe('Press militar');
  });

  it('should not emit save when form is invalid', () => {
    let emitted = false;
    component.save.subscribe(() => (emitted = true));

    component.form.setValue({ nombre: '   ' });
    component.submit();

    expect(emitted).toBe(false);
  });
});
