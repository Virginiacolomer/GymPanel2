import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EjercicioFormComponent } from './ejercicio-form';

describe('EjercicioFormComponent', () => {
  let component: EjercicioFormComponent;
  let fixture: ComponentFixture<EjercicioFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjercicioFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EjercicioFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit create with trimmed name on valid submission and reset form', () => {
    let emittedName: string | undefined;
    component.create.subscribe((name) => {
      emittedName = name;
    });

    component.form.setValue({ nombre: '  Sentadillas  ' });
    component.submit();

    expect(emittedName).toBe('Sentadillas');
    expect(component.form.getRawValue().nombre).toBe('');
  });

  it('should not emit create when form has only whitespace', () => {
    let emitted = false;
    component.create.subscribe(() => {
      emitted = true;
    });

    component.form.setValue({ nombre: '   ' });
    component.submit();

    expect(emitted).toBe(false);
  });
});
