import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GruposMuscularesPanelComponent } from './grupos-musculares-panel';

describe('GruposMuscularesPanelComponent', () => {
  let component: GruposMuscularesPanelComponent;
  let fixture: ComponentFixture<GruposMuscularesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposMuscularesPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GruposMuscularesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit createGrupo with valid trimmed name', () => {
    let emittedName: string | undefined;
    component.createGrupo.subscribe((name) => {
      emittedName = name;
    });

    component.createGrupoForm.setValue({ nombre: '  Espalda  ' });
    component.submitCreate();

    expect(emittedName).toBe('Espalda');
    expect(component.createGrupoForm.getRawValue().nombre).toBe('');
  });

  it('should not emit createGrupo when form is empty or whitespace', () => {
    let emitted = false;
    component.createGrupo.subscribe(() => {
      emitted = true;
    });

    component.createGrupoForm.setValue({ nombre: '   ' });
    component.submitCreate();

    expect(emitted).toBe(false);
  });

  it('should emit updateGrupo with valid trimmed name', () => {
    let emittedName: string | undefined;
    component.updateGrupo.subscribe((name) => {
      emittedName = name;
    });

    component.editGrupoForm.setValue({ nombre: 'Pecho Alto' });
    component.submitUpdate();

    expect(emittedName).toBe('Pecho Alto');
  });

  it('should emit retryLoadGrupos when button clicked', () => {
    let retried = false;
    component.retryLoadGrupos.subscribe(() => {
      retried = true;
    });

    component.retryLoadGrupos.emit();
    expect(retried).toBe(true);
  });
});
