import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GrupoModalComponent } from './grupo-modal';

describe('GrupoModalComponent', () => {
  let component: GrupoModalComponent;
  let fixture: ComponentFixture<GrupoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GrupoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit save when form is valid and submit() is called', () => {
    let savedNombre = '';
    component.save.subscribe((val) => (savedNombre = val));

    component.form.setValue({ nombre: 'Espalda' });
    component.submit();

    expect(savedNombre).toBe('Espalda');
  });

  it('should not emit save when form is invalid', () => {
    let emitted = false;
    component.save.subscribe(() => (emitted = true));

    component.form.setValue({ nombre: '   ' });
    component.submit();

    expect(emitted).toBe(false);
  });
});
